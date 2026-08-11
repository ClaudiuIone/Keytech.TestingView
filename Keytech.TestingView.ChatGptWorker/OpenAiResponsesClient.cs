using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Keytech.TestingView.ChatGptWorker;

internal sealed class OpenAiResponsesClient
{
    private readonly HttpClient _httpClient;
    private readonly OpenAiSettings _settings;
    private readonly string _apiKey;

    public OpenAiResponsesClient(HttpClient httpClient, OpenAiSettings settings, string apiKey)
    {
        _httpClient = httpClient;
        _settings = settings;
        _apiKey = apiKey;
    }

    public async Task<IReadOnlyList<string>> ListModelIdsAsync(CancellationToken cancellationToken)
    {
        string modelsUrl = ResolveModelsUrl(_settings.ResponsesUrl);
        using var request = new HttpRequestMessage(HttpMethod.Get, modelsUrl);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        using HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken);
        string payload = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI Models API returned {(int)response.StatusCode}: {TrimForLog(payload)}");
        }

        return ParseModelIds(payload);
    }

    public async Task<string> AnalyzeChartsAsync(
        string instructions,
        string symbol,
        IReadOnlyList<QueuedImage> images,
        CancellationToken cancellationToken)
    {
        var content = new List<object>
        {
            new
            {
                type = "input_text",
                text = BuildUserPrompt(symbol, images)
            }
        };

        foreach (QueuedImage image in images)
        {
            content.Add(new
            {
                type = "input_image",
                image_url = BuildDataUrl(image),
                detail = _settings.ImageDetail
            });
        }

        var requestBody = new
        {
            model = _settings.Model,
            instructions,
            input = new object[]
            {
                new
                {
                    role = "user",
                    content
                }
            },
            reasoning = new
            {
                effort = _settings.ReasoningEffort
            },
            text = new
            {
                verbosity = _settings.TextVerbosity
            },
            max_output_tokens = _settings.MaxOutputTokens
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, _settings.ResponsesUrl)
        {
            Content = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json")
        };
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);

        using HttpResponseMessage response = await SendWithRetriesAsync(request, cancellationToken);
        string payload = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"OpenAI Responses API returned {(int)response.StatusCode}: {TrimForLog(payload)}");
        }

        string outputText = ExtractOutputText(payload);
        if (string.IsNullOrWhiteSpace(outputText))
        {
            throw new InvalidOperationException("OpenAI Responses API returned no text output.");
        }

        return outputText.Trim();
    }

    private async Task<HttpResponseMessage> SendWithRetriesAsync(HttpRequestMessage originalRequest, CancellationToken cancellationToken)
    {
        string body = originalRequest.Content is null
            ? ""
            : await originalRequest.Content.ReadAsStringAsync(cancellationToken);

        for (int attempt = 0; ; attempt++)
        {
            using HttpRequestMessage request = CloneRequest(originalRequest, body);
            HttpResponseMessage response = await _httpClient.SendAsync(request, cancellationToken);
            if (!ShouldRetry(response.StatusCode) || attempt >= _settings.MaxRetries)
            {
                return response;
            }

            TimeSpan delay = GetRetryDelay(response, attempt);
            response.Dispose();
            await Task.Delay(delay, cancellationToken);
        }
    }

    private static HttpRequestMessage CloneRequest(HttpRequestMessage original, string body)
    {
        var request = new HttpRequestMessage(original.Method, original.RequestUri)
        {
            Content = new StringContent(body, Encoding.UTF8, "application/json")
        };

        foreach (KeyValuePair<string, IEnumerable<string>> header in original.Headers)
        {
            request.Headers.TryAddWithoutValidation(header.Key, header.Value);
        }

        return request;
    }

    private TimeSpan GetRetryDelay(HttpResponseMessage response, int attempt)
    {
        if (response.Headers.RetryAfter?.Delta is { } delta)
        {
            return delta;
        }

        int delayMs = _settings.RetryBaseDelayMilliseconds * (int)Math.Pow(2, attempt);
        return TimeSpan.FromMilliseconds(delayMs);
    }

    private static bool ShouldRetry(HttpStatusCode statusCode)
    {
        return statusCode is HttpStatusCode.TooManyRequests
            or HttpStatusCode.InternalServerError
            or HttpStatusCode.BadGateway
            or HttpStatusCode.ServiceUnavailable
            or HttpStatusCode.GatewayTimeout;
    }

    private static string BuildUserPrompt(string symbol, IReadOnlyList<QueuedImage> images)
    {
        string imageList = string.Join(Environment.NewLine, images.Select((image, index) =>
            $"{index + 1}. {image.FileName} ({image.MimeType})"));

        return $"""
        Analyze the attached TradingView chart screenshot batch for symbol {symbol}.

        Files:
        {imageList}

        Return only the analysis narrative that should be posted back to the trader.
        """;
    }

    private static string BuildDataUrl(QueuedImage image)
    {
        string mimeType = string.IsNullOrWhiteSpace(image.MimeType) ? "image/png" : image.MimeType.Trim();
        string base64 = image.ImageBase64.Trim();

        if (base64.StartsWith("data:", StringComparison.OrdinalIgnoreCase))
        {
            return base64;
        }

        return $"data:{mimeType};base64,{base64}";
    }

    private static string ExtractOutputText(string payload)
    {
        using JsonDocument document = JsonDocument.Parse(payload);
        JsonElement root = document.RootElement;

        if (root.TryGetProperty("output_text", out JsonElement outputText)
            && outputText.ValueKind == JsonValueKind.String)
        {
            return outputText.GetString() ?? "";
        }

        if (!root.TryGetProperty("output", out JsonElement output)
            || output.ValueKind != JsonValueKind.Array)
        {
            return "";
        }

        var parts = new List<string>();
        foreach (JsonElement outputItem in output.EnumerateArray())
        {
            if (!outputItem.TryGetProperty("content", out JsonElement content)
                || content.ValueKind != JsonValueKind.Array)
            {
                continue;
            }

            foreach (JsonElement contentItem in content.EnumerateArray())
            {
                if (contentItem.TryGetProperty("type", out JsonElement type)
                    && type.GetString() == "output_text"
                    && contentItem.TryGetProperty("text", out JsonElement text)
                    && text.ValueKind == JsonValueKind.String)
                {
                    parts.Add(text.GetString() ?? "");
                }
            }
        }

        return string.Join(Environment.NewLine, parts.Where(p => !string.IsNullOrWhiteSpace(p)));
    }

    private static string ResolveModelsUrl(string responsesUrl)
    {
        if (!Uri.TryCreate(responsesUrl, UriKind.Absolute, out Uri? responsesUri))
        {
            return "https://api.openai.com/v1/models";
        }

        string path = responsesUri.AbsolutePath;
        if (path.EndsWith("/responses", StringComparison.OrdinalIgnoreCase))
        {
            path = path[..^"/responses".Length] + "/models";
        }
        else
        {
            path = "/v1/models";
        }

        return new UriBuilder(responsesUri) { Path = path, Query = "" }.Uri.ToString();
    }

    private static IReadOnlyList<string> ParseModelIds(string payload)
    {
        using JsonDocument document = JsonDocument.Parse(payload);
        if (!document.RootElement.TryGetProperty("data", out JsonElement data)
            || data.ValueKind != JsonValueKind.Array)
        {
            return [];
        }

        return data.EnumerateArray()
            .Select(item => item.TryGetProperty("id", out JsonElement id) ? id.GetString() : null)
            .Where(id => !string.IsNullOrWhiteSpace(id))
            .Select(id => id!)
            .OrderBy(id => id, StringComparer.OrdinalIgnoreCase)
            .ToArray();
    }

    private static string TrimForLog(string value)
    {
        const int maxLength = 1200;
        return value.Length <= maxLength ? value : value[..maxLength] + "...";
    }
}
