using System.Text;

namespace Keytech.TestingView.ChatGptWorker;

internal sealed class ChatGptReplyLogger
{
    private readonly string _logFilePath;
    private readonly SemaphoreSlim _lock = new(1, 1);

    public ChatGptReplyLogger(string logFilePath)
    {
        _logFilePath = ResolveLogFilePath(logFilePath);
    }

    public async Task LogReplyAsync(
        string user,
        string symbol,
        string model,
        IReadOnlyList<QueuedImage> images,
        string reply,
        CancellationToken cancellationToken)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_logFilePath)!);

        string entry = BuildEntry(user, symbol, model, images, reply);

        await _lock.WaitAsync(cancellationToken);
        try
        {
            await File.AppendAllTextAsync(_logFilePath, entry, Encoding.UTF8, cancellationToken);
        }
        finally
        {
            _lock.Release();
        }
    }

    private static string BuildEntry(
        string user,
        string symbol,
        string model,
        IReadOnlyList<QueuedImage> images,
        string reply)
    {
        DateTimeOffset now = DateTimeOffset.Now;
        string imageList = images.Count == 0
            ? "(none)"
            : string.Join(", ", images.Select(i => string.IsNullOrWhiteSpace(i.FileName) ? "(unnamed)" : i.FileName));

        return $"""
        ============================================================
        Timestamp: {now:yyyy-MM-dd HH:mm:ss zzz}
        TimestampUtc: {now.UtcDateTime:yyyy-MM-dd HH:mm:ss}Z
        User: {user}
        Symbol: {symbol}
        Model: {model}
        Images: {imageList}

        {reply.Trim()}


        """;
    }

    private static string ResolveLogFilePath(string logFilePath)
    {
        string path = string.IsNullOrWhiteSpace(logFilePath)
            ? "Logs/chatgpt-replies.log"
            : logFilePath.Trim();

        return Path.IsPathRooted(path)
            ? path
            : Path.Combine(AppContext.BaseDirectory, path);
    }
}
