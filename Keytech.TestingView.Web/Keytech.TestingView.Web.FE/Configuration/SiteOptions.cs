namespace Keytech.TestingView.Web.FE.Configuration;

public class SiteOptions
{
    public const string SectionName = "Site";
    public string BaseUrl { get; set; } = "https://testingview.com";
    /// <summary>Browser-aware redirect path or absolute URL for “Get extension” links.</summary>
    public string ExtensionUrl { get; set; } = "/extension";
    public string ChromeExtensionUrl { get; set; } = "https://chromewebstore.google.com/detail/testingviewcom-tradingvi/hbbkodlaakiaednefgdbinpkfgfbpall";
    public string EdgeExtensionUrl { get; set; } = "https://microsoftedge.microsoft.com/addons/detail/testingviewcom-trading/dgdmaikclacjjahegiiocihglciaclfh";
    public string FirefoxExtensionUrl { get; set; } = "https://addons.mozilla.org/en-US/firefox/addon/testingview/";
    public string DesktopAppUrl { get; set; } = "/setup";
    public string DesktopAppDownloadFileName { get; set; } = "TradingView x TestingView.exe";
    /// <summary>Optional absolute path to the desktop launcher exe (overrides downloads folder and build output).</summary>
    public string DesktopAppSourcePath { get; set; } = "";
    public string DiscordUrl { get; set; } = "";
}

public class TestingViewGoogleOptions
{
    public const string SectionName = "Google";
    public string ClientId { get; set; } = "";
    public string ClientSecret { get; set; } = "";
}

public class StripeOptions
{
    public const string SectionName = "Stripe";
    /// <summary>Connected account id (acct_...) when using an sk_org_ organization secret.</summary>
    public string AccountId { get; set; } = "";
    public string PublishableKey { get; set; } = "";
    public string SecretKey { get; set; } = "";
    public string WebhookSecret { get; set; } = "";
    public string ExplorerPriceId { get; set; } = "";
    public string TraderPriceId { get; set; } = "";
}

public class EmailOptions
{
    public const string SectionName = "Email";
    public string SmtpHost { get; set; } = "";
    public int SmtpPort { get; set; } = 587;
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public string FromAddress { get; set; } = "";
    public string FromName { get; set; } = "TestingView";
}
