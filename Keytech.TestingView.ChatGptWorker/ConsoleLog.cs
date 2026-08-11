using System.Globalization;

namespace Keytech.TestingView.ChatGptWorker;

internal static class ConsoleLog
{
    private static readonly object Sync = new();

    public static void Info(string message)
    {
        Write(Console.Out, message);
    }

    public static void Error(string message)
    {
        Write(Console.Error, message);
    }

    private static void Write(TextWriter writer, string message)
    {
        string timestamp = DateTimeOffset.Now.ToString("yyyy-MM-dd HH:mm:ss zzz", CultureInfo.InvariantCulture);

        lock (Sync)
        {
            using var reader = new StringReader(message);
            bool wroteLine = false;
            string? line;
            while ((line = reader.ReadLine()) is not null)
            {
                writer.WriteLine($"[{timestamp}] {line}");
                wroteLine = true;
            }

            if (!wroteLine)
            {
                writer.WriteLine($"[{timestamp}]");
            }
        }
    }
}
