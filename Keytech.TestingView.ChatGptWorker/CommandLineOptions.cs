namespace Keytech.TestingView.ChatGptWorker;

internal sealed class CommandLineOptions
{
    public string? ConfigPath { get; private init; }
    public bool RunOnce { get; private init; }
    public bool DryRun { get; private init; }
    public string[]? Symbols { get; private init; }

    public static CommandLineOptions Parse(string[] args)
    {
        string? configPath = null;
        bool runOnce = false;
        bool dryRun = false;
        string[]? symbols = null;

        for (int i = 0; i < args.Length; i++)
        {
            string arg = args[i];
            switch (arg)
            {
                case "--config":
                    configPath = RequireValue(args, ref i, arg);
                    break;
                case "--symbol":
                    symbols = SplitSymbols(RequireValue(args, ref i, arg));
                    break;
                case "--once":
                    runOnce = true;
                    break;
                case "--dry-run":
                    dryRun = true;
                    break;
                case "--help":
                case "-h":
                case "/?":
                    PrintUsage();
                    Environment.Exit(0);
                    break;
                default:
                    throw new ArgumentException($"Unknown argument: {arg}");
            }
        }

        return new CommandLineOptions
        {
            ConfigPath = configPath,
            RunOnce = runOnce,
            DryRun = dryRun,
            Symbols = symbols
        };
    }

    public void ApplyTo(AppSettings settings)
    {
        if (Symbols is { Length: > 0 })
        {
            settings.TestingView.Symbols = Symbols;
        }
    }

    public static void PrintUsage()
    {
        ConsoleLog.Info("""
        Keytech.TestingView.ChatGptWorker

        Options:
          --config <path>     Path to appsettings.json.
          --symbol <symbols>  Comma-separated TestingView symbols to poll.
          --once              Poll once and exit.
          --dry-run           Poll and log without calling OpenAI, posting notes, or deleting images.
          --help              Show this help.

        Required runtime setup:
          set OpenAI:OpenApiKey in appsettings.json
          set TESTINGVIEW_SYMBOL=<symbol>  (or configure TestingView:Symbols in appsettings.json)
        """);
    }

    private static string RequireValue(string[] args, ref int index, string argument)
    {
        if (index + 1 >= args.Length)
        {
            throw new ArgumentException($"{argument} requires a value.");
        }

        index++;
        return args[index];
    }

    private static string[] SplitSymbols(string value)
    {
        return value
            .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .ToArray();
    }
}
