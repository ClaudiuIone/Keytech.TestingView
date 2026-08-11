using Keytech.TestingView.Web.FE.Configuration;
using Keytech.TestingView.Web.FE.Services;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authentication.Google;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Options;

var contentRoot = Directory.GetCurrentDirectory();
var angularBrowser = Path.Combine(contentRoot, "ClientApp", "dist", "client-app", "browser");
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ContentRootPath = contentRoot,
    WebRootPath = Directory.Exists(angularBrowser) ? angularBrowser : null,
});

builder.WebHost.UseIIS();

builder.Services.Configure<SiteOptions>(builder.Configuration.GetSection(SiteOptions.SectionName));
builder.Services.Configure<TestingViewGoogleOptions>(builder.Configuration.GetSection(TestingViewGoogleOptions.SectionName));
builder.Services.Configure<StripeOptions>(builder.Configuration.GetSection(StripeOptions.SectionName));
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));

builder.Services.AddSingleton<TestingViewDb>();
builder.Services.AddSingleton<KnowledgeBaseService>();
builder.Services.AddScoped<AccountService>();
builder.Services.AddScoped<BillingService>();
builder.Services.AddScoped<EmailService>();
builder.Services.AddSingleton<DesktopAppFileResolver>();

var google = builder.Configuration.GetSection(TestingViewGoogleOptions.SectionName).Get<TestingViewGoogleOptions>() ?? new();

var googleEnabled = !string.IsNullOrWhiteSpace(google.ClientId) && !string.IsNullOrWhiteSpace(google.ClientSecret);
var secureCookies = !builder.Environment.IsDevelopment();
var authBuilder = builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultScheme = AccountService.AuthScheme;
        // API calls must get 401, not a Google OAuth redirect (XHR cannot follow cross-origin 302).
        options.DefaultChallengeScheme = AccountService.AuthScheme;
    })
    .AddCookie(AccountService.AuthScheme, options =>
    {
        options.Cookie.Name = "TestingView.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SecurePolicy = secureCookies ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.LoginPath = "/account";
        options.SlidingExpiration = true;
        options.ExpireTimeSpan = TimeSpan.FromDays(30);
        options.Events.OnRedirectToLogin = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status401Unauthorized;
                return Task.CompletedTask;
            }

            context.Response.Redirect(context.RedirectUri ?? "/account");
            return Task.CompletedTask;
        };
        options.Events.OnRedirectToAccessDenied = context =>
        {
            if (context.Request.Path.StartsWithSegments("/api"))
            {
                context.Response.StatusCode = StatusCodes.Status403Forbidden;
                return Task.CompletedTask;
            }

            context.Response.Redirect("/account");
            return Task.CompletedTask;
        };
    });

if (googleEnabled)
{
    authBuilder.AddGoogle(GoogleDefaults.AuthenticationScheme, options =>
    {
        options.ClientId = google.ClientId;
        options.ClientSecret = google.ClientSecret;
        options.CallbackPath = "/signin-google";
        options.SaveTokens = false;
        options.CorrelationCookie.SecurePolicy = secureCookies ? CookieSecurePolicy.Always : CookieSecurePolicy.SameAsRequest;
        options.CorrelationCookie.SameSite = SameSiteMode.Lax;
        options.Events.OnRemoteFailure = context =>
        {
            context.Response.Redirect("/account?error=google");
            context.HandleResponse();
            return Task.CompletedTask;
        };
        options.Events.OnTicketReceived = async context =>
        {
            try
            {
                var accounts = context.HttpContext.RequestServices.GetRequiredService<AccountService>();
                var user = await accounts.SignInGoogleAsync(context.Principal!, context.HttpContext.RequestAborted);
                await accounts.SignInAsync(context.HttpContext, user, context.HttpContext.RequestAborted);
                context.HandleResponse();
                var returnUrl = context.Properties?.Items.TryGetValue("returnUrl", out var url) == true ? url : "/account";
                context.Response.Redirect(returnUrl ?? "/account");
            }
            catch (Exception ex)
            {
                var logger = context.HttpContext.RequestServices
                    .GetRequiredService<ILoggerFactory>()
                    .CreateLogger("GoogleAuth");
                logger.LogError(ex, "Google sign-in failed after OAuth callback");
                context.HandleResponse();
                context.Response.Redirect("/account?error=google");
            }
        };
    });
}

builder.Services.AddAuthorization();
builder.Services.AddAntiforgery(options => options.HeaderName = "X-XSRF-TOKEN");
builder.Services.AddControllersWithViews();
builder.Services.AddSpaStaticFiles(configuration =>
{
    configuration.RootPath = "ClientApp/dist/client-app/browser";
});

builder.Services.AddResponseCompression();
builder.Services.AddMemoryCache();

var dataProtectionPath = Path.Combine(contentRoot, "DataProtection-Keys");
Directory.CreateDirectory(dataProtectionPath);
builder.Services.AddDataProtection()
    .PersistKeysToFileSystem(new DirectoryInfo(dataProtectionPath))
    .SetApplicationName("TestingView.Web.FE");

var app = builder.Build();

var stripeOptions = app.Services.GetRequiredService<IOptions<StripeOptions>>().Value;
var siteOptions = app.Services.GetRequiredService<IOptions<SiteOptions>>().Value;
var stripeStatus = StripeConfigurationStatus.Evaluate(stripeOptions, siteOptions);
var startupLogger = app.Services.GetRequiredService<ILoggerFactory>().CreateLogger("Stripe");
if (stripeStatus.CheckoutReady)
    startupLogger.LogInformation("Stripe checkout is configured (inline price data: {Inline})", stripeStatus.UsesInlinePriceData);
else
    startupLogger.LogWarning("Stripe checkout is not ready. Set Stripe:SecretKey and Stripe:AccountId for sk_org_ keys.");
if (!stripeStatus.WebhooksReady)
    startupLogger.LogWarning("Stripe webhooks not ready. Set Stripe:WebhookSecret and register {WebhookUrl}", stripeStatus.WebhookUrl);

var desktopResolver = app.Services.GetRequiredService<DesktopAppFileResolver>();
var desktopPath = desktopResolver.ResolveExecutablePath();
if (desktopPath == null)
    startupLogger.LogWarning("Desktop app download is unavailable. Publish Keytech.TestingView.App to {Downloads}", Path.Combine(app.Environment.ContentRootPath, "downloads"));
else
    startupLogger.LogInformation("Desktop app download ready at {Path}", desktopPath);

if (!app.Environment.IsDevelopment())
{
    app.UseHsts();
    var forwardedHeaders = new ForwardedHeadersOptions
    {
        ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto,
    };
    forwardedHeaders.KnownNetworks.Clear();
    forwardedHeaders.KnownProxies.Clear();
    app.UseForwardedHeaders(forwardedHeaders);
}

app.UseResponseCompression();
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

var resourcesPath = Path.Combine(app.Environment.ContentRootPath, "Resources");
if (!Directory.Exists(resourcesPath))
    resourcesPath = Path.GetFullPath(Path.Combine(app.Environment.ContentRootPath, "..", "Resources"));
if (Directory.Exists(resourcesPath))
{
    app.UseStaticFiles(new StaticFileOptions
    {
        FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(resourcesPath),
        RequestPath = "/assets",
        OnPrepareResponse = ctx =>
        {
            ctx.Context.Response.Headers.CacheControl = "public,max-age=31536000,immutable";
        },
    });
}

app.UseDefaultFiles();
app.UseStaticFiles();
app.UseSpaStaticFiles();
app.UseRouting();
app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();

app.MapControllers();
app.MapGet("/setup", (DesktopAppFileResolver desktopApp, ILoggerFactory loggerFactory) =>
{
    var path = desktopApp.ResolveExecutablePath();
    if (path == null)
    {
        loggerFactory.CreateLogger("DesktopApp").LogWarning("Desktop app executable not found for /setup download.");
        return Results.NotFound("The desktop app is not available right now. Please try again later.");
    }

    return Results.File(path, contentType: "application/octet-stream", fileDownloadName: desktopApp.DownloadFileName, enableRangeProcessing: true);
}).AllowAnonymous();
app.MapGet("/api/antiforgery/token", (HttpContext ctx) =>
{
    var tokens = ctx.RequestServices.GetRequiredService<Microsoft.AspNetCore.Antiforgery.IAntiforgery>().GetAndStoreTokens(ctx);
    return Results.Ok(new { token = tokens.RequestToken });
});

var spaPath = Path.Combine(app.Environment.ContentRootPath, "ClientApp", "dist", "client-app", "browser");
if (Directory.Exists(spaPath))
{
    app.MapFallbackToFile("index.html");
}
else if (app.Environment.IsDevelopment())
{
    app.MapWhen(ctx => !IsServerHandledPath(ctx.Request.Path), sub => sub.UseSpa(spa =>
    {
        spa.Options.SourcePath = "ClientApp";
        spa.UseProxyToSpaDevelopmentServer("http://localhost:4200");
    }));
}

app.Run();

static bool IsServerHandledPath(PathString path) =>
    path.StartsWithSegments("/api")
    || path.StartsWithSegments("/assets")
    || path.StartsWithSegments("/setup")
    || path.StartsWithSegments("/extension");
