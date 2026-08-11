using System.Text.Json;

namespace Keytech.TestingView.ChatGptWorker;

internal sealed class AppSettings
{
    public OpenAiSettings OpenAI { get; set; } = new();
    public TestingViewSettings TestingView { get; set; } = new();
    public string ConfigPath { get; private set; } = "";

    public static async Task<AppSettings> LoadAsync(string? configPath, CancellationToken cancellationToken)
    {
        string path = ResolveConfigPath(configPath);
        if (!File.Exists(path))
        {
            throw new FileNotFoundException($"Configuration file not found: {path}", path);
        }

        await using FileStream stream = File.OpenRead(path);
        AppSettings? settings = await JsonSerializer.DeserializeAsync<AppSettings>(
            stream,
            JsonDefaults.Options,
            cancellationToken);

        settings ??= new AppSettings();
        settings.ConfigPath = path;
        settings.ApplyEnvironmentOverrides();
        settings.Normalize();
        return settings;
    }

    private static string ResolveConfigPath(string? configPath)
    {
        if (!string.IsNullOrWhiteSpace(configPath))
        {
            return Path.GetFullPath(configPath);
        }

        string basePathConfig = Path.Combine(AppContext.BaseDirectory, "appsettings.json");
        if (File.Exists(basePathConfig))
        {
            return basePathConfig;
        }

        return Path.Combine(Environment.CurrentDirectory, "appsettings.json");
    }

    private void ApplyEnvironmentOverrides()
    {
        string? symbols = Environment.GetEnvironmentVariable("TESTINGVIEW_SYMBOLS");
        if (!string.IsNullOrWhiteSpace(symbols))
        {
            TestingView.Symbols = SplitList(symbols).ToArray();
        }

        string? singleSymbol = Environment.GetEnvironmentVariable("TESTINGVIEW_SYMBOL");
        if (!string.IsNullOrWhiteSpace(singleSymbol))
        {
            TestingView.Symbols = [singleSymbol.Trim()];
        }

        string? model = Environment.GetEnvironmentVariable("OPENAI_MODEL");
        if (!string.IsNullOrWhiteSpace(model))
        {
            OpenAI.Model = model.Trim();
        }

        string? acceptedUsers = Environment.GetEnvironmentVariable("TESTINGVIEW_ACCEPTED_USERS");
        if (!string.IsNullOrWhiteSpace(acceptedUsers))
        {
            TestingView.AcceptedUsers = SplitList(acceptedUsers).ToArray();
        }
    }

    private void Normalize()
    {
        OpenAI.Normalize();
        TestingView.Normalize();
    }

    private static IEnumerable<string> SplitList(string value)
    {
        return value
            .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(s => !string.IsNullOrWhiteSpace(s));
    }
}

internal sealed class OpenAiSettings
{
    public string OpenApiKey { get; set; } = "";
    public string ResponsesUrl { get; set; } = "https://api.openai.com/v1/responses";
    public string Model { get; set; } = OpenAiDefaults.LatestModel;
    public string ReasoningEffort { get; set; } = "medium";
    public string TextVerbosity { get; set; } = "medium";
    public string ImageDetail { get; set; } = "auto";
    public int MaxOutputTokens { get; set; } = 2000;
    public int MaxRetries { get; set; } = 3;
    public int RetryBaseDelayMilliseconds { get; set; } = 1000;

    public void Normalize()
    {
        OpenApiKey = OpenApiKey?.Trim() ?? "";
        ResponsesUrl = NormalizeValue(ResponsesUrl, "https://api.openai.com/v1/responses");
        Model = NormalizeValue(Model, OpenAiDefaults.LatestModel);
        ReasoningEffort = NormalizeValue(ReasoningEffort, "medium").ToLowerInvariant();
        TextVerbosity = NormalizeValue(TextVerbosity, "medium").ToLowerInvariant();
        ImageDetail = NormalizeValue(ImageDetail, "auto").ToLowerInvariant();

        if (MaxOutputTokens <= 0)
        {
            MaxOutputTokens = 2000;
        }

        if (MaxRetries < 0)
        {
            MaxRetries = 0;
        }

        if (RetryBaseDelayMilliseconds <= 0)
        {
            RetryBaseDelayMilliseconds = 1000;
        }
    }

    private static string NormalizeValue(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }
}

internal sealed class TestingViewSettings
{
    public string ImageApiUrl { get; set; } = "https://api.testingview.com/gpt/image";
    public string ImageRemoveUrl { get; set; } = "https://api.testingview.com/gpt/image-remove";
    public string[] AcceptedUsers { get; set; } = ["eBacktesting"];
    public string NotesApiUrl { get; set; } = "https://api.testingview.com/notes";
    public string[] Symbols { get; set; } = [];
    public int PollIntervalMilliseconds { get; set; } = 500;
    public int BatchImageCount { get; set; } = 6;
    public int FlushPartialBatchAfterSeconds { get; set; } = 0;
    public int FailureRetryDelaySeconds { get; set; } = 20;
    public bool PostProgressNotes { get; set; } = true;
    public string ReplyLogFilePath { get; set; } = "Logs/chatgpt-replies.log";

    public void Normalize()
    {
        ImageApiUrl = NormalizeValue(ImageApiUrl, "https://api.testingview.com/gpt/image");
        ImageRemoveUrl = NormalizeValue(ImageRemoveUrl, "https://api.testingview.com/gpt/image-remove");
        AcceptedUsers = AcceptedUsers
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        NotesApiUrl = NormalizeValue(NotesApiUrl, "https://api.testingview.com/notes");
        Symbols = Symbols
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        if (PollIntervalMilliseconds < 100)
        {
            PollIntervalMilliseconds = 500;
        }

        if (BatchImageCount < 1)
        {
            BatchImageCount = 1;
        }

        if (FlushPartialBatchAfterSeconds < 0)
        {
            FlushPartialBatchAfterSeconds = 0;
        }

        if (FailureRetryDelaySeconds < 1)
        {
            FailureRetryDelaySeconds = 20;
        }

        ReplyLogFilePath = NormalizeValue(ReplyLogFilePath, "Logs/chatgpt-replies.log");
    }

    private static string NormalizeValue(string? value, string fallback)
    {
        return string.IsNullOrWhiteSpace(value) ? fallback : value.Trim();
    }
}

internal static class OpenAiDefaults
{
    public const string LatestModel = "gpt-5.6-sol";
}
