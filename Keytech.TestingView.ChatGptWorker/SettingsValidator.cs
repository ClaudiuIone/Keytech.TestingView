namespace Keytech.TestingView.ChatGptWorker;

internal static class SettingsValidator
{
    private static readonly HashSet<string> ReasoningEfforts = new(StringComparer.OrdinalIgnoreCase)
    {
        "none",
        "low",
        "medium",
        "high",
        "xhigh",
        "max"
    };

    private static readonly HashSet<string> TextVerbosities = new(StringComparer.OrdinalIgnoreCase)
    {
        "low",
        "medium",
        "high"
    };

    private static readonly HashSet<string> ImageDetails = new(StringComparer.OrdinalIgnoreCase)
    {
        "low",
        "high",
        "auto"
    };

    public static void Validate(AppSettings settings, bool dryRun)
    {
        if (!dryRun && string.IsNullOrWhiteSpace(settings.OpenAI.OpenApiKey))
        {
            throw new InvalidOperationException("Missing OpenAI API key. Set OpenAI:OpenApiKey in appsettings.json before running.");
        }

        RequireAbsoluteUri(settings.OpenAI.ResponsesUrl, nameof(settings.OpenAI.ResponsesUrl));
        RequireAbsoluteUri(settings.TestingView.ImageApiUrl, nameof(settings.TestingView.ImageApiUrl));
        RequireAbsoluteUri(settings.TestingView.ImageRemoveUrl, nameof(settings.TestingView.ImageRemoveUrl));
        RequireAbsoluteUri(settings.TestingView.NotesApiUrl, nameof(settings.TestingView.NotesApiUrl));

        if (settings.TestingView.AcceptedUsers.Length == 0)
        {
            throw new InvalidOperationException("No accepted users configured. Set TestingView:AcceptedUsers.");
        }

        if (settings.TestingView.Symbols.Length == 0)
        {
            throw new InvalidOperationException("No TestingView symbols configured. Set TestingView:Symbols, TESTINGVIEW_SYMBOL, or pass --symbol.");
        }

        if (!ReasoningEfforts.Contains(settings.OpenAI.ReasoningEffort))
        {
            throw new InvalidOperationException($"Unsupported reasoning effort: {settings.OpenAI.ReasoningEffort}");
        }

        if (!TextVerbosities.Contains(settings.OpenAI.TextVerbosity))
        {
            throw new InvalidOperationException($"Unsupported text verbosity: {settings.OpenAI.TextVerbosity}");
        }

        if (!ImageDetails.Contains(settings.OpenAI.ImageDetail))
        {
            throw new InvalidOperationException($"Unsupported image detail: {settings.OpenAI.ImageDetail}");
        }
    }

    private static void RequireAbsoluteUri(string value, string name)
    {
        if (!Uri.TryCreate(value, UriKind.Absolute, out _))
        {
            throw new InvalidOperationException($"{name} must be an absolute URL.");
        }
    }
}
