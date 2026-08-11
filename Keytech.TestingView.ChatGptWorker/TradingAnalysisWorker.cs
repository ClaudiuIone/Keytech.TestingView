namespace Keytech.TestingView.ChatGptWorker;

internal sealed class TradingAnalysisWorker
{
    private readonly AppSettings _settings;
    private readonly TestingViewClient _testingViewClient;
    private readonly OpenAiResponsesClient _openAiClient;
    private readonly ChatGptReplyLogger _replyLogger;
    private readonly PromptLoader _promptLoader;
    private readonly bool _dryRun;
    private readonly Dictionary<string, SymbolState> _states = new(StringComparer.OrdinalIgnoreCase);

    public TradingAnalysisWorker(
        AppSettings settings,
        TestingViewClient testingViewClient,
        OpenAiResponsesClient openAiClient,
        ChatGptReplyLogger replyLogger,
        PromptLoader promptLoader,
        bool dryRun)
    {
        _settings = settings;
        _testingViewClient = testingViewClient;
        _openAiClient = openAiClient;
        _replyLogger = replyLogger;
        _promptLoader = promptLoader;
        _dryRun = dryRun;
    }

    public async Task RunAsync(CancellationToken cancellationToken)
    {
        while (!cancellationToken.IsCancellationRequested)
        {
            await RunOnceAsync(cancellationToken);
            await Task.Delay(_settings.TestingView.PollIntervalMilliseconds, cancellationToken);
        }
    }

    public async Task RunOnceAsync(CancellationToken cancellationToken)
    {
        foreach (ImageQueueTarget target in GetTargets())
        {
            await ProcessSymbolAsync(target.User, target.Symbol, cancellationToken);
        }
    }

    private IReadOnlyList<ImageQueueTarget> GetTargets()
    {
        return _states.Values
            .Where(state => state.HasWork)
            .Select(state => new ImageQueueTarget(state.User, state.Symbol))
            .Concat(_settings.TestingView.AcceptedUsers.SelectMany(user =>
                _settings.TestingView.Symbols.Select(symbol => new ImageQueueTarget(user, symbol))))
            .Distinct()
            .ToArray();
    }

    private async Task ProcessSymbolAsync(string user, string symbol, CancellationToken cancellationToken)
    {
        SymbolState state = GetState(user, symbol);
        await TryPostPendingOutputAsync(user, symbol, state, cancellationToken);

        if (state.PendingOutput is not null || DateTimeOffset.UtcNow < state.RetryAfter)
        {
            return;
        }

        try
        {
            await PollImageAsync(user, symbol, state, cancellationToken);
        }
        catch (Exception e)
        {
            ConsoleLog.Info($"Error PollImageAsync: {e.Message}");
        }

        if (ShouldAnalyze(state))
        {
            await AnalyzeBufferedImagesAsync(user, symbol, state, cancellationToken);
        }
    }

    private async Task PollImageAsync(string user, string symbol, SymbolState state, CancellationToken cancellationToken)
    {
        if (state.Images.Count >= _settings.TestingView.BatchImageCount)
        {
            return;
        }

        QueuedImage? image = await _testingViewClient.GetNextImageAsync(user, symbol, cancellationToken);
        if (image is null)
        {
            return;
        }

        string fileName = string.IsNullOrWhiteSpace(image.FileName)
            ? $"SNAPSHOT_{DateTime.UtcNow:yyyyMMdd_HHmmss}.png"
            : image.FileName;
        image.FileName = fileName;

        if (state.Images.Any(i => string.Equals(i.FileName, fileName, StringComparison.OrdinalIgnoreCase)))
        {
            ConsoleLog.Info($"[{user}][{symbol}] Duplicate queued image seen again: {fileName}");
            if (!_dryRun)
            {
                await _testingViewClient.RemoveImageAsync(user, symbol, fileName, cancellationToken);
            }
            return;
        }

        state.Add(image);
        ConsoleLog.Info($"[{user}][{symbol}] Queued {fileName} ({state.Images.Count}/{_settings.TestingView.BatchImageCount}).");

        if (_dryRun)
        {
            return;
        }

        if (_settings.TestingView.PostProgressNotes)
        {
            await _testingViewClient.PostNoteAsync(symbol, $"Analysing {fileName}", cancellationToken);
        }

        bool removed = await _testingViewClient.RemoveImageAsync(user, symbol, fileName, cancellationToken);
        if (!removed)
        {
            ConsoleLog.Error($"[{user}][{symbol}] Failed to remove image from queue after buffering: {fileName}");
        }
    }

    private bool ShouldAnalyze(SymbolState state)
    {
        if (state.Images.Count == 0)
        {
            return false;
        }

        if (state.Images.Count >= _settings.TestingView.BatchImageCount)
        {
            return true;
        }

        int flushSeconds = _settings.TestingView.FlushPartialBatchAfterSeconds;
        return flushSeconds > 0
            && state.FirstImageAt is { } firstImageAt
            && DateTimeOffset.UtcNow - firstImageAt >= TimeSpan.FromSeconds(flushSeconds);
    }

    private async Task AnalyzeBufferedImagesAsync(string user, string symbol, SymbolState state, CancellationToken cancellationToken)
    {
        if (_dryRun)
        {
            ConsoleLog.Info($"[{user}][{symbol}] Dry run: would analyze {state.Images.Count} image(s).");
            state.Clear();
            return;
        }

        try
        {
            ConsoleLog.Info($"[{user}][{symbol}] Sending {state.Images.Count} image(s) to OpenAI Responses API.");
            if (_settings.TestingView.PostProgressNotes)
            {
                await _testingViewClient.PostNoteAsync(symbol, $"ChatGPT is processing {state.Images.Count} image(s)...", cancellationToken);
            }

            string prompt = await _promptLoader.LoadAsync(user, cancellationToken);
            state.PendingOutput = await _openAiClient.AnalyzeChartsAsync(prompt, symbol, state.Images, cancellationToken);
            ConsoleLog.Info($"[{user}][{symbol}] ChatGPT response:{Environment.NewLine}{state.PendingOutput}");
            await _replyLogger.LogReplyAsync(user, symbol, _settings.OpenAI.Model, state.Images, state.PendingOutput, cancellationToken);
            await TryPostPendingOutputAsync(user, symbol, state, cancellationToken);
        }
        catch (Exception ex) when (ex is not OperationCanceledException)
        {
            state.RetryAfter = DateTimeOffset.UtcNow.AddSeconds(_settings.TestingView.FailureRetryDelaySeconds);
            ConsoleLog.Error($"[{user}][{symbol}] Analysis failed; retrying after {state.RetryAfter:O}. {ex.Message}");
        }
    }

    private async Task TryPostPendingOutputAsync(string user, string symbol, SymbolState state, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(state.PendingOutput))
        {
            return;
        }

        bool posted = _dryRun || await _testingViewClient.PostNoteAsync(symbol, state.PendingOutput, cancellationToken);
        if (!posted)
        {
            ConsoleLog.Error($"[{user}][{symbol}] Failed to post analysis to notes; will retry.");
            return;
        }

        ConsoleLog.Info($"[{user}][{symbol}] Posted analysis.");
        state.Clear();
    }

    private SymbolState GetState(string user, string symbol)
    {
        string normalizedUser = NormalizeUser(user);
        string key = $"{normalizedUser.ToUpperInvariant()}\n{symbol.Trim().ToUpperInvariant()}";
        if (!_states.TryGetValue(key, out SymbolState? state))
        {
            state = new SymbolState(normalizedUser, symbol.Trim().ToUpperInvariant());
            _states[key] = state;
        }

        return state;
    }

    private static string NormalizeUser(string user)
    {
        return user.Trim();
    }
}

internal sealed record ImageQueueTarget(string User, string Symbol);
