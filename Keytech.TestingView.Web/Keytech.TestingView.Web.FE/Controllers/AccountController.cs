using System.ComponentModel.DataAnnotations;
using Keytech.TestingView.Web.FE.Configuration;
using Keytech.TestingView.Web.FE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.Web.FE.Controllers;

[ApiController]
[Route("api/account")]
public class AccountController : ControllerBase
{
    private readonly AccountService _accounts;
    private readonly BillingService _billing;

    public AccountController(AccountService accounts, BillingService billing)
    {
        _accounts = accounts;
        _billing = billing;
    }

    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me(CancellationToken cancellationToken)
    {
        var user = await _accounts.GetCurrentUserAsync(User, cancellationToken);
        if (user == null) return Unauthorized();

        string? portalUrl = null;
        try
        {
            portalUrl = await _billing.CreatePortalSessionAsync(user, cancellationToken);
        }
        catch
        {
            // Graceful when Stripe is not configured or no customer exists.
        }

        return Ok(new
        {
            userId = user.UserId,
            email = user.Email,
            tradingViewUsername = user.TradingViewUsername,
            planId = user.Plan?.PlanId,
            planName = user.Plan?.Name,
            planExpiration = user.PlanExpiration,
            billingPortalUrl = portalUrl,
            hasStripeCustomer = portalUrl != null,
        });
    }

    [HttpPost("tradingview-username")]
    [Authorize]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> UpdateTradingViewUsername([FromBody] TradingViewUsernameRequest request, CancellationToken cancellationToken)
    {
        var userId = _accounts.GetUserId(User);
        if (userId == null) return Unauthorized();

        try
        {
            var user = await _accounts.UpdateTradingViewUsernameAsync(userId.Value, request.Username, cancellationToken);
            return Ok(new
            {
                tradingViewUsername = user.TradingViewUsername,
                message = "TradingView username updated successfully.",
            });
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
}

public class TradingViewUsernameRequest
{
    [Required]
    public string Username { get; set; } = "";
}
