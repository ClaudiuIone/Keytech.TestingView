using Keytech.TestingView.Web.FE.Configuration;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.Web.FE.Controllers;

[AllowAnonymous]
public class ExtensionController : Controller
{
    private readonly SiteOptions _site;

    public ExtensionController(IOptions<SiteOptions> site)
    {
        _site = site.Value;
    }

    [HttpGet("/extension")]
    public IActionResult RedirectToStore()
    {
        var userAgent = Request.Headers.UserAgent.ToString();
        var target = ResolveStoreUrl(userAgent);
        var separator = target.Contains('?', StringComparison.Ordinal) ? '&' : '?';
        return Redirect($"{target}{separator}utm_source=site");
    }

    private string ResolveStoreUrl(string userAgent)
    {
        if (userAgent.Contains("Edg", StringComparison.OrdinalIgnoreCase))
            return _site.EdgeExtensionUrl;

        if (userAgent.Contains("Firefox", StringComparison.OrdinalIgnoreCase))
            return _site.FirefoxExtensionUrl;

        return _site.ChromeExtensionUrl;
    }
}
