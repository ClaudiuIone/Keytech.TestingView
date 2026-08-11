using System.Text;
using System.Text.Json;

namespace Keytech.TestingView.ChatGptWorker;

internal sealed class TestingViewClient
{
    private readonly HttpClient _httpClient;
    private readonly TestingViewSettings _settings;

    public TestingViewClient(HttpClient httpClient, TestingViewSettings settings)
    {
        _httpClient = httpClient;
        _settings = settings;
    }

    public async Task<QueuedImage?> GetNextImageAsync(string user, string symbol, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(HttpMethod.Get, WithQuery(_settings.ImageApiUrl, ("symbol", symbol)));
        request.Headers.TryAddWithoutValidation("user", user);

        using HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken);
        if (response.StatusCode == System.Net.HttpStatusCode.NoContent)
        {
            return null;
        }

        string payload = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"TestingView image API returned {(int)response.StatusCode}: {payload}");
        }

        QueuedImage? image = JsonSerializer.Deserialize<QueuedImage>(payload, JsonDefaults.Options);
        if (image is null || string.IsNullOrWhiteSpace(image.ImageBase64))
        {
            return null;
        }

        image.User = string.IsNullOrWhiteSpace(image.User) ? user : image.User;
        return image;
    }

    public async Task<bool> RemoveImageAsync(string user, string symbol, string fileName, CancellationToken cancellationToken)
    {
        using var request = new HttpRequestMessage(
            HttpMethod.Post,
            WithQuery(_settings.ImageRemoveUrl, ("symbol", symbol), ("filename", fileName)));
        request.Headers.TryAddWithoutValidation("user", user);

        using HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken);
        return response.IsSuccessStatusCode || response.StatusCode == System.Net.HttpStatusCode.NoContent;
    }

    public async Task<bool> PostNoteAsync(string symbol, string note, CancellationToken cancellationToken)
    {
        using var content = new StringContent(note, Encoding.UTF8, "text/plain");
        using HttpResponseMessage response = await _httpClient.PostAsync(
            WithQuery(_settings.NotesApiUrl, ("symbol", symbol)),
            content,
            cancellationToken);

        if (response.IsSuccessStatusCode)
        {
            return true;
        }

        string body = await response.Content.ReadAsStringAsync(cancellationToken);
        ConsoleLog.Error($"TestingView notes API returned {(int)response.StatusCode}: {body}");
        return false;
    }

    private static Uri WithQuery(string url, params (string Key, string Value)[] values)
    {
        var builder = new UriBuilder(url);
        var queryParts = new List<string>();

        if (!string.IsNullOrWhiteSpace(builder.Query))
        {
            queryParts.Add(builder.Query.TrimStart('?'));
        }

        foreach ((string key, string value) in values)
        {
            queryParts.Add($"{Uri.EscapeDataString(key)}={Uri.EscapeDataString(value)}");
        }

        builder.Query = string.Join("&", queryParts);
        return builder.Uri;
    }
}
