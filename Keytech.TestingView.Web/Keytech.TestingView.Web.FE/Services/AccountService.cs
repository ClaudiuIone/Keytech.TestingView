using System.Security.Claims;
using System.Text.RegularExpressions;
using Keytech.TestingView.Data.Administration;
using Keytech.TestingView.Web.FE.Configuration;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;

namespace Keytech.TestingView.Web.FE.Services;

public class AccountService
{
    public const string AuthScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    private readonly TestingViewDb _db;
    private readonly EmailService _email;
    private readonly ILogger<AccountService> _logger;

    public AccountService(TestingViewDb db, EmailService email, ILogger<AccountService> logger)
    {
        _db = db;
        _email = email;
        _logger = logger;
    }

    public Guid? GetUserId(ClaimsPrincipal user)
    {
        var id = user.FindFirstValue(ClaimTypes.NameIdentifier);
        return Guid.TryParse(id, out var userId) ? userId : null;
    }

    public async Task<User?> GetCurrentUserAsync(ClaimsPrincipal principal, CancellationToken cancellationToken)
    {
        var userId = GetUserId(principal);
        if (userId == null) return null;
        var db = await _db.OpenAsync(cancellationToken);
        return await db.Administration.GetUserById(userId.Value, cancellationToken);
    }

    public async Task<User> SignInGoogleAsync(ClaimsPrincipal googlePrincipal, CancellationToken cancellationToken)
    {
        var subject = googlePrincipal.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? throw new InvalidOperationException("Google subject missing.");
        var email = googlePrincipal.FindFirstValue(ClaimTypes.Email);
        var name = googlePrincipal.FindFirstValue(ClaimTypes.Name);
        var picture = googlePrincipal.FindFirstValue("picture");

        if (string.IsNullOrWhiteSpace(email))
            throw new InvalidOperationException("A verified Google email is required.");

        var db = await _db.OpenAsync(cancellationToken);
        var external = await db.Web.GetExternalLoginByProvider("Google", subject, cancellationToken);
        User user;

        if (external != null)
        {
            user = await db.Administration.GetUserById(external.UserId, cancellationToken)
                ?? throw new InvalidOperationException("Linked user not found.");
        }
        else
        {
            var existingUserId = await db.Administration.GetUserId(new User { Email = email }, cancellationToken);
            if (existingUserId.HasValue)
            {
                user = await db.Administration.GetUserById(existingUserId.Value, cancellationToken)
                    ?? throw new InvalidOperationException("User not found.");
            }
            else
            {
                user = new User
                {
                    UserId = Guid.NewGuid(),
                    Email = email,
                    TradingViewUsername = "",
                    Plan = new Plan { PlanId = Plan.Starter, Name = "Starter" },
                    PlanExpiration = DateTimeOffset.MinValue,
                    Language = new Data.UI.Language { LanguageCode = "en" },
                };
                await db.Administration.SaveUser(user);
                await db.Web.InsertAccountAuditEvent(user.UserId, "UserCreated", "Google sign-up", cancellationToken);
            }

            await db.Web.UpsertExternalLogin(user.UserId, "Google", subject, email, name, picture, cancellationToken);
            await db.Web.InsertAccountAuditEvent(user.UserId, "GoogleLinked", null, cancellationToken);
        }

        return user;
    }

    public async Task SignInAsync(HttpContext httpContext, User user, CancellationToken cancellationToken)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.UserId.ToString()),
            new(ClaimTypes.Email, user.Email ?? ""),
            new(ClaimTypes.Name, user.TradingViewUsername ?? user.Email ?? "User"),
            new("plan", user.Plan?.Name ?? "Starter"),
        };

        await httpContext.SignInAsync(AuthScheme, new ClaimsPrincipal(new ClaimsIdentity(claims, AuthScheme)),
            new AuthenticationProperties
            {
                IsPersistent = true,
                ExpiresUtc = DateTimeOffset.UtcNow.AddDays(30),
            });
    }

    public Task SignOutAsync(HttpContext httpContext) =>
        httpContext.SignOutAsync(AuthScheme);

    public async Task<User> UpdateTradingViewUsernameAsync(Guid userId, string username, CancellationToken cancellationToken)
    {
        username = username?.Trim() ?? "";
        if (string.IsNullOrWhiteSpace(username))
            throw new ArgumentException("TradingView username is required.");
        if (!Regex.IsMatch(username, @"^[a-zA-Z0-9_]+$"))
            throw new ArgumentException("TradingView username contains invalid characters.");

        var db = await _db.OpenAsync(cancellationToken);
        var existingUserId = await db.Administration.GetUserId(new User { TradingViewUsername = username }, cancellationToken);
        if (existingUserId.HasValue && existingUserId.Value != userId)
            throw new InvalidOperationException("This TradingView username is already linked to another account.");

        var user = await db.Administration.GetUserById(userId, cancellationToken)
            ?? throw new InvalidOperationException("User not found.");
        user.TradingViewUsername = username;
        await db.Administration.SaveUser(user);
        await db.Web.InsertAccountAuditEvent(userId, "TradingViewUsernameChanged", username, cancellationToken);

        if (!string.IsNullOrWhiteSpace(user.Email))
        {
            await _email.SendAsync(user.Email,
                "TradingView username updated",
                $"<p>Your TestingView TradingView username was updated to <strong>{username}</strong>.</p>",
                cancellationToken);
        }

        return user;
    }
}
