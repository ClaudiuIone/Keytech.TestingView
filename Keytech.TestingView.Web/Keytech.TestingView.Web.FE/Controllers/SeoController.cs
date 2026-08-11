using Keytech.TestingView.Web.FE.Configuration;
using Keytech.TestingView.Web.FE.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Text;
using System.Xml.Linq;

namespace Keytech.TestingView.Web.FE.Controllers;

[AllowAnonymous]
public class SeoController : ControllerBase
{
    private readonly SiteOptions _site;
    private readonly KnowledgeBaseService _knowledgeBase;

    public SeoController(IOptions<SiteOptions> site, KnowledgeBaseService knowledgeBase)
    {
        _site = site.Value;
        _knowledgeBase = knowledgeBase;
    }

    [HttpGet("/robots.txt")]
    public ContentResult Robots() => Content(
        $"User-agent: *\nAllow: /\nDisallow: /account\nDisallow: /api/\nSitemap: {_site.BaseUrl}/sitemap.xml\n",
        "text/plain");

    [HttpGet("/sitemap.xml")]
    public async Task<IActionResult> Sitemap(CancellationToken cancellationToken)
    {
        var doc = await _knowledgeBase.GetDocumentAsync(cancellationToken);
        XNamespace ns = "http://www.sitemaps.org/schemas/sitemap/0.9";
        var urls = new[]
        {
            "", "features", "knowledge-base", "terms", "privacy", "refund-policy", "accessibility", "pricing", "account"
        }.Select(path => new XElement(ns + "url",
            new XElement(ns + "loc", $"{_site.BaseUrl}/{path}".TrimEnd('/')),
            new XElement(ns + "changefreq", "weekly")));

        foreach (var item in doc.AllItems)
        {
            urls = urls.Append(new XElement(ns + "url",
                new XElement(ns + "loc", $"{_site.BaseUrl}/knowledge-base/{item.Slug}"),
                new XElement(ns + "changefreq", "monthly")));
        }

        var sitemap = new XElement(ns + "urlset", urls);
        return Content(sitemap.ToString(), "application/xml", Encoding.UTF8);
    }
}
