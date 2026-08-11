using Keytech.TestingView.Data.Administration;
using Keytech.TestingView.Data.Web;
using UserPlan = Keytech.TestingView.Data.Administration.Plan;
using Keytech.TestingView.Web.FE.Configuration;
using Stripe;
using Stripe.Checkout;

namespace Keytech.TestingView.Web.FE.Services;

public class BillingService
{
    private readonly TestingViewDb _db;
    private readonly StripeOptions _stripe;
    private readonly SiteOptions _site;
    private readonly EmailService _email;
    private readonly ILogger<BillingService> _logger;

    public BillingService(
        TestingViewDb db,
        IOptions<StripeOptions> stripe,
        IOptions<SiteOptions> site,
        EmailService email,
        ILogger<BillingService> logger)
    {
        _db = db;
        _stripe = stripe.Value;
        _site = site.Value;
        _email = email;
        _logger = logger;
        StripeRequestOptionsFactory.ApplyApiKey(_stripe);
    }

    public bool IsConfigured => StripeConfigurationStatus.Evaluate(_stripe, _site).CheckoutReady;

    public StripeConfigurationStatus GetStatus() => StripeConfigurationStatus.Evaluate(_stripe, _site);

    public async Task<string> CreateCheckoutSessionAsync(User user, Guid planId, CancellationToken cancellationToken)
    {
        EnsureCheckoutReady();
        var plan = PlanCatalog.GetById(planId) ?? throw new ArgumentException("Invalid plan.");
        if (plan.MonthlyPrice <= 0)
            throw new InvalidOperationException("Starter plan does not require checkout.");

        var requestOptions = StripeRequestOptionsFactory.Create(_stripe);
        var db = await _db.OpenAsync(cancellationToken);
        var customer = await db.Web.GetStripeCustomerByUserId(user.UserId, cancellationToken);
        var customerService = new CustomerService();
        string customerId;

        if (customer == null)
        {
            var created = await customerService.CreateAsync(new CustomerCreateOptions
            {
                Email = user.Email,
                Metadata = BuildMetadata(user, plan),
            }, requestOptions, cancellationToken);
            customerId = created.Id;
            await db.Web.UpsertStripeCustomer(customerId, user.UserId, user.Email, cancellationToken);
        }
        else
        {
            customerId = customer.StripeCustomerId;
        }

        var lineItem = BuildLineItem(plan);
        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            Customer = customerId,
            SuccessUrl = $"{_site.BaseUrl.TrimEnd('/')}/account?checkout=success",
            CancelUrl = $"{_site.BaseUrl.TrimEnd('/')}/account?checkout=cancelled",
            LineItems = [lineItem],
            SubscriptionData = new SessionSubscriptionDataOptions
            {
                Metadata = BuildMetadata(user, plan),
                TrialPeriodDays = plan.TrialDays,
            },
            Metadata = BuildMetadata(user, plan),
            AllowPromotionCodes = false,
        };

        var session = await new SessionService().CreateAsync(options, requestOptions, cancellationToken);
        if (string.IsNullOrWhiteSpace(session.Url))
            throw new InvalidOperationException("Stripe did not return a checkout URL.");

        return session.Url;
    }

    public async Task<string?> CreatePortalSessionAsync(User user, CancellationToken cancellationToken)
    {
        EnsureCheckoutReady();
        var db = await _db.OpenAsync(cancellationToken);
        var customer = await db.Web.GetStripeCustomerByUserId(user.UserId, cancellationToken);
        if (customer == null) return null;

        var requestOptions = StripeRequestOptionsFactory.Create(_stripe);
        var session = await new Stripe.BillingPortal.SessionService().CreateAsync(new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = customer.StripeCustomerId,
            ReturnUrl = $"{_site.BaseUrl.TrimEnd('/')}/account",
        }, requestOptions, cancellationToken);

        return session.Url;
    }

    public async Task<bool> HandleWebhookAsync(string json, string signature, CancellationToken cancellationToken)
    {
        var status = GetStatus();
        if (!status.WebhooksReady)
        {
            _logger.LogWarning("Stripe webhook rejected: WebhookSecret or AccountId not configured.");
            return false;
        }

        Event stripeEvent;
        try
        {
            stripeEvent = EventUtility.ConstructEvent(json, signature, _stripe.WebhookSecret);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Invalid Stripe webhook signature");
            return false;
        }

        var db = await _db.OpenAsync(cancellationToken);
        var isNew = await db.Web.TryRecordStripeEvent(stripeEvent.Id, stripeEvent.Type, null, cancellationToken);
        if (!isNew) return true;

        switch (stripeEvent.Type)
        {
            case "checkout.session.completed":
                await HandleCheckoutCompletedAsync(stripeEvent, cancellationToken);
                break;
            case "customer.subscription.created":
            case "customer.subscription.updated":
            case "customer.subscription.deleted":
                await HandleSubscriptionChangeAsync(stripeEvent, cancellationToken);
                break;
            case "invoice.payment_succeeded":
            case "invoice.payment_failed":
                await HandleInvoiceAsync(stripeEvent, cancellationToken);
                break;
        }

        return true;
    }

    private SessionLineItemOptions BuildLineItem(PlanDefinition plan)
    {
        var configuredPriceId = plan.PlanId == PlanCatalog.Explorer ? _stripe.ExplorerPriceId : _stripe.TraderPriceId;
        if (!string.IsNullOrWhiteSpace(configuredPriceId))
        {
            return new SessionLineItemOptions { Price = configuredPriceId, Quantity = 1 };
        }

        var amount = (long)(plan.MonthlyPrice * 100m);
        return new SessionLineItemOptions
        {
            Quantity = 1,
            PriceData = new SessionLineItemPriceDataOptions
            {
                Currency = "usd",
                UnitAmount = amount,
                Recurring = new SessionLineItemPriceDataRecurringOptions { Interval = "month" },
                ProductData = new SessionLineItemPriceDataProductDataOptions
                {
                    Name = $"TestingView {plan.Name}",
                    Metadata = new Dictionary<string, string>
                    {
                        ["planId"] = plan.PlanId.ToString(),
                        ["planName"] = plan.Name,
                    },
                },
            },
        };
    }

    private async Task HandleCheckoutCompletedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var session = stripeEvent.Data.Object as Session;
        if (session?.SubscriptionId == null) return;

        var requestOptions = StripeRequestOptionsFactory.Create(_stripe);
        var subscription = await new SubscriptionService().GetAsync(session.SubscriptionId, null, requestOptions, cancellationToken);
        await ApplySubscriptionAsync(subscription, cancellationToken);
    }

    private async Task HandleSubscriptionChangeAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription != null)
            await ApplySubscriptionAsync(subscription, cancellationToken);
    }

    private async Task HandleInvoiceAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        if (invoice?.CustomerEmail == null) return;
        var subject = stripeEvent.Type == "invoice.payment_succeeded"
            ? "TestingView payment received"
            : "TestingView payment failed";
        await _email.SendAsync(invoice.CustomerEmail, subject,
            $"<p>Your TestingView subscription payment status: <strong>{stripeEvent.Type}</strong>.</p>",
            cancellationToken);
    }

    private async Task ApplySubscriptionAsync(Subscription subscription, CancellationToken cancellationToken)
    {
        var userId = ParseGuid(subscription.Metadata.GetValueOrDefault("userId"));
        var planId = ParseGuid(subscription.Metadata.GetValueOrDefault("planId"))
            ?? PlanCatalog.GetPlanIdByStripePrice(subscription.Items?.Data?.FirstOrDefault()?.Price?.Id, _stripe);

        if (userId == null) return;

        var db = await _db.OpenAsync(cancellationToken);
        await db.Web.UpsertStripeSubscription(new StripeSubscription
        {
            StripeSubscriptionId = subscription.Id,
            UserId = userId.Value,
            StripeCustomerId = subscription.CustomerId,
            PlanId = planId ?? UserPlan.Starter,
            Status = subscription.Status,
            CurrentPeriodEnd = subscription.CurrentPeriodEnd,
            CancelAtPeriodEnd = subscription.CancelAtPeriodEnd,
        }, cancellationToken);

        var effectivePlanId = subscription.Status is "active" or "trialing"
            ? (planId ?? UserPlan.Starter)
            : UserPlan.Starter;
        var expiration = subscription.CurrentPeriodEnd;

        var user = await db.Administration.GetUserById(userId.Value, cancellationToken);
        if (user != null)
        {
            var planName = PlanCatalog.GetById(effectivePlanId)?.Name ?? "Starter";
            user.Plan = new UserPlan { PlanId = effectivePlanId, Name = planName };
            user.PlanExpiration = expiration;
            await db.Administration.SaveUser(user);
        }

        await db.Web.InsertAccountAuditEvent(userId, "StripeSubscriptionUpdated", subscription.Status, cancellationToken);
        if (user?.Email != null)
        {
            await _email.SendAsync(user.Email, "TestingView plan updated",
                $"<p>Your plan is now <strong>{PlanCatalog.GetById(effectivePlanId)?.Name ?? "Starter"}</strong>.</p>",
                cancellationToken);
        }
    }

    private void EnsureCheckoutReady()
    {
        var status = GetStatus();
        if (status.CheckoutReady) return;

        if (!status.SecretKeyConfigured)
            throw new InvalidOperationException("Stripe is not configured. Set Stripe:SecretKey.");

        if (status.RequiresAccountId && !status.AccountIdConfigured)
            throw new InvalidOperationException(
                "Stripe organization key requires Stripe:AccountId (your connected account id, e.g. acct_...).");
    }

    private static Dictionary<string, string> BuildMetadata(User user, PlanDefinition plan) => new()
    {
        ["userId"] = user.UserId.ToString(),
        ["planId"] = plan.PlanId.ToString(),
        ["planName"] = plan.Name,
        ["tradingViewUsername"] = user.TradingViewUsername ?? "",
        ["email"] = user.Email ?? "",
    };

    private static Guid? ParseGuid(string? value) =>
        Guid.TryParse(value, out var id) ? id : null;
}
