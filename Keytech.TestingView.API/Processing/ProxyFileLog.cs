using System.Text;
using System.Text.RegularExpressions;

namespace Keytech.TestingView.API.Processing
{
    internal static partial class ProxyFileLog
    {
        private static readonly object Gate = new();
        private static readonly Regex SecretFieldPattern = CreateSecretFieldPattern();

        public static string Path { get; } = System.IO.Path.Combine(
            AppContext.BaseDirectory,
            "logs",
            "proxy.log");

        public static void Info(string message)
        {
            Write("INFO", message);
        }

        public static void Exception(Exception exception, string context)
        {
            Write("ERROR", $"{context}{Environment.NewLine}{exception}");
        }

        public static string Sanitize(string? value)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                return "";
            }

            return SecretFieldPattern.Replace(value, "$1=***");
        }

        private static void Write(string level, string message)
        {
            try
            {
                var directory = System.IO.Path.GetDirectoryName(Path);

                if (!string.IsNullOrWhiteSpace(directory))
                {
                    Directory.CreateDirectory(directory);
                }

                var line = new StringBuilder()
                    .Append(DateTimeOffset.Now.ToString("O"))
                    .Append(" [")
                    .Append(level)
                    .Append("] ")
                    .Append(message)
                    .AppendLine()
                    .ToString();

                lock (Gate)
                {
                    File.AppendAllText(Path, line);
                }
            }
            catch
            {
            }
        }

        [GeneratedRegex(@"(?i)\b(token|user)=([^&\s]+)")]
        private static partial Regex CreateSecretFieldPattern();
    }
}
