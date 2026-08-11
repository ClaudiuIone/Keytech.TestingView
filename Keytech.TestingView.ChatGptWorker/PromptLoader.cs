namespace Keytech.TestingView.ChatGptWorker;

internal sealed class PromptLoader
{
    private const string UserPromptDirectory = "Prompts/users";

    public PromptLoader()
    {
    }

    public async Task<string> LoadAsync(string user, CancellationToken cancellationToken)
    {
        string normalizedUser = NormalizeUser(user);
        string path = ResolvePromptPath(Path.Combine(UserPromptDirectory, $"{normalizedUser}.md"));

        if (!File.Exists(path))
        {
            throw new FileNotFoundException($"Prompt file not found for user '{normalizedUser}': {path}", path);
        }

        string prompt = await File.ReadAllTextAsync(path, cancellationToken);
        if (string.IsNullOrWhiteSpace(prompt))
        {
            throw new InvalidOperationException($"Prompt file is empty for user '{normalizedUser}': {path}");
        }

        return prompt.Trim();
    }

    private static string ResolvePromptPath(string promptFile)
    {
        if (Path.IsPathRooted(promptFile))
        {
            return promptFile;
        }

        string basePathFile = Path.Combine(AppContext.BaseDirectory, promptFile);
        if (File.Exists(basePathFile))
        {
            return basePathFile;
        }

        return Path.Combine(Environment.CurrentDirectory, promptFile);
    }

    private static string NormalizeUser(string user)
    {
        return user.Trim();
    }
}
