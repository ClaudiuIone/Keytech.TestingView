using System.ComponentModel.DataAnnotations;
using Keytech.TestingView.Web.FE.Configuration;
using Keytech.TestingView.Web.FE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.Web.FE.Controllers;

[ApiController]
[Route("api/billing")]
public class BillingController : ControllerBase
{
    private readonly AccountService _accounts;
    private readonly BillingService _billing;

    public BillingController(AccountService accounts, BillingService billing)
    {
        _accounts = accounts;
        _billing = billing;
    }

    [HttpPost("checkout")]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Checkout([FromBody] CheckoutRequest request, CancellationToken cancellationToken)
    {
        if (!PlanCatalog.Plans.Any(p => p.PlanId == request.PlanId && p.MonthlyPrice > 0))
            return BadRequest(new { error = "Invalid paid plan." });

        var user = await _accounts.GetCurrentUserAsync(User, cancellationToken);
        if (user == null) return Unauthorized();

        try
        {
            var url = await _billing.CreateCheckoutSessionAsync(user, request.PlanId, cancellationToken);
            return Ok(new { url });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message, stripe = _billing.GetStatus() });
        }
    }

    [HttpPost("portal")]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Portal(CancellationToken cancellationToken)
    {
        var user = await _accounts.GetCurrentUserAsync(User, cancellationToken);
        if (user == null) return Unauthorized();

        var url = await _billing.CreatePortalSessionAsync(user, cancellationToken);
        if (url == null)
            return NotFound(new { error = "No Stripe billing profile found yet. Subscribe to a paid plan first." });

        return Ok(new { url });
    }

    [HttpPost("cancel")]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Cancel(CancellationToken cancellationToken)
    {
        var user = await _accounts.GetCurrentUserAsync(User, cancellationToken);
        if (user == null) return Unauthorized();

        var url = await _billing.CreatePortalSessionAsync(user, cancellationToken);
        if (url == null)
            return NotFound(new { error = "No active subscription to cancel." });

        return Ok(new { url, message = "Use the billing portal to cancel or change your subscription." });
    }
}

public class CheckoutRequest
{
    [Required]
    public Guid PlanId { get; set; }
}
