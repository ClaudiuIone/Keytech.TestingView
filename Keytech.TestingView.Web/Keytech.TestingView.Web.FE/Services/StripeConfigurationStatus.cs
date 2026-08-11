using Keytech.TestingView.Web.FE.Configuration;

namespace Keytech.TestingView.Web.FE.Services;

public class StripeConfigurationStatus
{
    public static StripeConfigurationStatus Evaluate(StripeOptions options, SiteOptions site) => new()
    {
        SecretKeyConfigured = !string.IsNullOrWhiteSpace(options.SecretKey),
        PublishableKeyConfigured = !string.IsNullOrWhiteSpace(options.PublishableKey),
        WebhookSecretConfigured = !string.IsNullOrWhiteSpace(options.WebhookSecret),
        ExplorerPriceIdConfigured = !string.IsNullOrWhiteSpace(options.ExplorerPriceId),
        TraderPriceIdConfigured = !string.IsNullOrWhiteSpace(options.TraderPriceId),
        AccountIdConfigured = !string.IsNullOrWhiteSpace(options.AccountId),
        RequiresAccountId = StripeRequestOptionsFactory.RequiresAccountId(options),
        CheckoutReady = IsCheckoutReady(options),
        WebhooksReady = !string.IsNullOrWhiteSpace(options.SecretKey) && !string.IsNullOrWhiteSpace(options.WebhookSecret)
            && (!StripeRequestOptionsFactory.RequiresAccountId(options) || !string.IsNullOrWhiteSpace(options.AccountId)),
        WebhookUrl = $"{site.BaseUrl.TrimEnd('/')}/api/stripe/webhook",
        UsesInlinePriceData = string.IsNullOrWhiteSpace(options.ExplorerPriceId) || string.IsNullOrWhiteSpace(options.TraderPriceId),
    };

    private static bool IsCheckoutReady(StripeOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.SecretKey)) return false;
        if (StripeRequestOptionsFactory.RequiresAccountId(options) && string.IsNullOrWhiteSpace(options.AccountId))
            return false;
        return true;
    }

    public bool SecretKeyConfigured { get; init; }
    public bool PublishableKeyConfigured { get; init; }
    public bool WebhookSecretConfigured { get; init; }
    public bool ExplorerPriceIdConfigured { get; init; }
    public bool TraderPriceIdConfigured { get; init; }
    public bool AccountIdConfigured { get; init; }
    public bool RequiresAccountId { get; init; }
    public bool CheckoutReady { get; init; }
    public bool WebhooksReady { get; init; }
    public bool UsesInlinePriceData { get; init; }
    public string WebhookUrl { get; init; } = "";
}
