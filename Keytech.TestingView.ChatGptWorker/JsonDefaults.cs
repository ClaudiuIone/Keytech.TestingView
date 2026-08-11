using System.Text.Json;

namespace Keytech.TestingView.ChatGptWorker;

internal static class JsonDefaults
{
    public static readonly JsonSerializerOptions Options = new()
    {
        AllowTrailingCommas = true,
        PropertyNameCaseInsensitive = true,
        ReadCommentHandling = JsonCommentHandling.Skip,
        WriteIndented = true
    };
}
