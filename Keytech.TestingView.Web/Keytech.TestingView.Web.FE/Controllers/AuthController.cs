using Keytech.TestingView.Web.FE.Services;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.Web.FE.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AccountService _accounts;
    private readonly IConfiguration _configuration;

    public AuthController(AccountService accounts, IConfiguration configuration)
    {
        _accounts = accounts;
        _configuration = configuration;
    }

    [HttpPost("google/start")]
    [AllowAnonymous]
    public IActionResult GoogleStart([FromQuery] string? returnUrl = "/account")
    {
        if (string.IsNullOrWhiteSpace(_configuration["Google:ClientId"]) ||
            string.IsNullOrWhiteSpace(_configuration["Google:ClientSecret"]))
        {
            return BadRequest(new { error = "Google login is not configured. Set Google:ClientId and Google:ClientSecret." });
        }

        var properties = new AuthenticationProperties();
        properties.Items["returnUrl"] = string.IsNullOrWhiteSpace(returnUrl) ? "/account" : returnUrl;
        return Challenge(properties, GoogleDefaults.AuthenticationScheme);
    }

    [HttpGet("google/start")]
    [AllowAnonymous]
    public IActionResult GoogleStartGet([FromQuery] string? returnUrl = "/account") => GoogleStart(returnUrl);

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await _accounts.SignOutAsync(HttpContext);
        return Ok();
    }
}
