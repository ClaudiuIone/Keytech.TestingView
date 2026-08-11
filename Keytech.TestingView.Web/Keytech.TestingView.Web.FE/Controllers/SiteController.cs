using Keytech.TestingView.Web.FE.Configuration;
using Keytech.TestingView.Web.FE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.Web.FE.Controllers;

[ApiController]
[Route("api/site")]
public class SiteController : ControllerBase
{
    private readonly SiteOptions _site;
    private readonly StripeOptions _stripe;

    public SiteController(IOptions<SiteOptions> site, IOptions<StripeOptions> stripe)
    {
        _site = site.Value;
        _stripe = stripe.Value;
    }

    [HttpGet]
    [AllowAnonymous]
    public IActionResult Get()
    {
        var stripeStatus = StripeConfigurationStatus.Evaluate(_stripe, _site);
        return Ok(new
        {
            baseUrl = _site.BaseUrl,
            extensionUrl = ResolveExtensionUrl(),
            desktopAppUrl = ResolveDesktopAppUrl(),
            discordUrl = _site.DiscordUrl,
            stripePublishableKey = _stripe.PublishableKey,
            stripe = new
            {
                checkoutReady = stripeStatus.CheckoutReady,
                webhooksReady = stripeStatus.WebhooksReady,
                webhookUrl = stripeStatus.WebhookUrl,
                usesInlinePriceData = stripeStatus.UsesInlinePriceData,
            },
            plans = PlanCatalog.Plans.Select(p => new
            {
                planId = p.PlanId,
                name = p.Name,
                monthlyPrice = p.MonthlyPrice,
                trialDays = p.TrialDays,
                imageUrl = $"/assets/{p.ImageFile}",
                recommended = p.Recommended,
                benefits = p.Benefits,
            }),
        });
    }

    private string ResolveExtensionUrl()
    {
        return ResolveSitePath(_site.ExtensionUrl);
    }

    private string ResolveDesktopAppUrl()
    {
        return ResolveSitePath(_site.DesktopAppUrl);
    }

    private string ResolveSitePath(string? configuredPath)
    {
        var configured = configuredPath?.Trim() ?? "";
        if (configured.StartsWith("http://", StringComparison.OrdinalIgnoreCase)
            || configured.StartsWith("https://", StringComparison.OrdinalIgnoreCase))
            return configured;

        var path = configured.StartsWith('/') ? configured : $"/{configured}";
        return $"{_site.BaseUrl.TrimEnd('/')}{path}";
    }
}
