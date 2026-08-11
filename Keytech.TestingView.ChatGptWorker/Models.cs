using System.Text.Json.Serialization;

namespace Keytech.TestingView.ChatGptWorker;

internal sealed class QueuedImage
{
    [JsonPropertyName("user")]
    public string User { get; set; } = "";

    [JsonPropertyName("success")]
    public bool Success { get; set; }

    [JsonPropertyName("imageBase64")]
    public string ImageBase64 { get; set; } = "";

    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = "";

    [JsonPropertyName("mimeType")]
    public string MimeType { get; set; } = "image/png";

    [JsonPropertyName("timestamp")]
    public DateTime? Timestamp { get; set; }
}

internal sealed class SymbolState
{
    public SymbolState(string user, string symbol)
    {
        User = user;
        Symbol = symbol;
    }

    public string User { get; }
    public string Symbol { get; }
    public List<QueuedImage> Images { get; } = [];
    public DateTimeOffset? FirstImageAt { get; set; }
    public DateTimeOffset RetryAfter { get; set; } = DateTimeOffset.MinValue;
    public string? PendingOutput { get; set; }

    public bool HasWork => Images.Count > 0 || !string.IsNullOrWhiteSpace(PendingOutput);

    public void Add(QueuedImage image)
    {
        if (Images.Count == 0)
        {
            FirstImageAt = DateTimeOffset.UtcNow;
        }

        Images.Add(image);
    }

    public void Clear()
    {
        Images.Clear();
        FirstImageAt = null;
        PendingOutput = null;
        RetryAfter = DateTimeOffset.MinValue;
    }
}
