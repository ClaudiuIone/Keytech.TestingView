using Keytech.TestingView.Web.FE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.Web.FE.Controllers;

[ApiController]
[Route("api/stripe/webhook")]
public class StripeWebhookController : ControllerBase
{
    private readonly BillingService _billing;

    public StripeWebhookController(BillingService billing) => _billing = billing;

    [HttpPost]
    [AllowAnonymous]
    public async Task<IActionResult> Webhook(CancellationToken cancellationToken)
    {
        var json = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync(cancellationToken);
        var signature = Request.Headers["Stripe-Signature"].ToString();
        var ok = await _billing.HandleWebhookAsync(json, signature, cancellationToken);
        return ok ? Ok() : BadRequest();
    }
}
