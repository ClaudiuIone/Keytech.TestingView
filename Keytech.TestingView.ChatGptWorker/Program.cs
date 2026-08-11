namespace Keytech.TestingView.ChatGptWorker;

internal static class Program
{
    public static async Task<int> Main(string[] args)
    {
        try
        {
            CommandLineOptions options = CommandLineOptions.Parse(args);

            using var cts = new CancellationTokenSource();
            Console.CancelKeyPress += (_, eventArgs) =>
            {
                eventArgs.Cancel = true;
                cts.Cancel();
            };

            AppSettings settings = await AppSettings.LoadAsync(options.ConfigPath, cts.Token);
            options.ApplyTo(settings);

            SettingsValidator.Validate(settings, options.DryRun);

            using var httpClient = new HttpClient
            {
                Timeout = TimeSpan.FromMinutes(5)
            };

            var testingViewClient = new TestingViewClient(httpClient, settings.TestingView);
            var openAiClient = new OpenAiResponsesClient(httpClient, settings.OpenAI, settings.OpenAI.OpenApiKey);
            var replyLogger = new ChatGptReplyLogger(settings.TestingView.ReplyLogFilePath);
            var promptLoader = new PromptLoader();
            var worker = new TradingAnalysisWorker(settings, testingViewClient, openAiClient, replyLogger, promptLoader, options.DryRun);

            await WriteStartupDiagnosticsAsync(settings, openAiClient, cts.Token);

            ConsoleLog.Info($"TestingView GPT worker started. Model={settings.OpenAI.Model}; Symbols={string.Join(", ", settings.TestingView.Symbols)}; DryRun={options.DryRun}");

            if (options.RunOnce)
            {
                await worker.RunOnceAsync(cts.Token);
                return 0;
            }

            await worker.RunAsync(cts.Token);
            return 0;
        }
        catch (OperationCanceledException)
        {
            ConsoleLog.Info("Stopping.");
            return 0;
        }
        catch (Exception ex)
        {
            ConsoleLog.Error(ex.Message);
            return 1;
        }
    }

    private static async Task WriteStartupDiagnosticsAsync(
        AppSettings settings,
        OpenAiResponsesClient openAiClient,
        CancellationToken cancellationToken)
    {
        ConsoleLog.Info($"Config file: {settings.ConfigPath}");
        ConsoleLog.Info($"Selected model: {settings.OpenAI.Model}");
        ConsoleLog.Info("""
            To change the model, edit OpenAI:Model in the config file above, for example:
              "OpenAI": {
                "Model": "gpt-5.6-sol"
              }
            Or set environment variable OPENAI_MODEL (e.g. OPENAI_MODEL=gpt-5.6-terra), then restart the worker.
            """);

        if (string.IsNullOrWhiteSpace(settings.OpenAI.OpenApiKey))
        {
            ConsoleLog.Info("Skipping available-models list (no OpenAI API key configured).");
            return;
        }

        try
        {
            IReadOnlyList<string> modelIds = await openAiClient.ListModelIdsAsync(cancellationToken);
            if (modelIds.Count == 0)
            {
                ConsoleLog.Info("Available models: (none returned).");
                return;
            }

            ConsoleLog.Info($"Available models ({modelIds.Count}):");
            foreach (string modelId in modelIds)
            {
                string marker = string.Equals(modelId, settings.OpenAI.Model, StringComparison.OrdinalIgnoreCase)
                    ? "  [selected] "
                    : "             ";
                ConsoleLog.Info($"{marker}{modelId}");
            }
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            ConsoleLog.Error($"Could not list available models: {ex.Message}");
        }
    }
}
