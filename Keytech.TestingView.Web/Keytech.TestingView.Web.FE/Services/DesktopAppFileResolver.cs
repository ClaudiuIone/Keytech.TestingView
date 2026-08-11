using Keytech.TestingView.Web.FE.Configuration;

namespace Keytech.TestingView.Web.FE.Services;

public class DesktopAppFileResolver
{
    public const string DefaultExeFileName = "TradingView x TestingView.exe";

    private readonly IWebHostEnvironment _environment;
    private readonly SiteOptions _site;

    public DesktopAppFileResolver(IWebHostEnvironment environment, IOptions<SiteOptions> site)
    {
        _environment = environment;
        _site = site.Value;
    }

    public string DownloadFileName =>
        string.IsNullOrWhiteSpace(_site.DesktopAppDownloadFileName)
            ? DefaultExeFileName
            : _site.DesktopAppDownloadFileName.Trim();

    public string? ResolveExecutablePath()
    {
        foreach (var candidate in CandidatePaths())
        {
            if (File.Exists(candidate))
                return candidate;
        }

        return null;
    }

    private IEnumerable<string> CandidatePaths()
    {
        if (!string.IsNullOrWhiteSpace(_site.DesktopAppSourcePath))
            yield return Path.GetFullPath(_site.DesktopAppSourcePath.Trim());

        yield return Path.Combine(_environment.ContentRootPath, "downloads", DownloadFileName);

        var repoRoot = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "..", ".."));
        foreach (var baseDir in new[] { "app.publish", "" })
        {
            yield return Path.Combine(
                repoRoot,
                "Keytech.TestingView.App",
                "bin",
                "Release",
                "net8.0",
                "win-x64",
                baseDir,
                DefaultExeFileName);
        }

        yield return Path.Combine(
            repoRoot,
            "Keytech.TestingView.App",
            "bin",
            "Release",
            "net8.0",
            DefaultExeFileName);
        yield return Path.Combine(
            repoRoot,
            "Keytech.TestingView.App",
            "bin",
            "Debug",
            "net8.0",
            DefaultExeFileName);
    }
}
