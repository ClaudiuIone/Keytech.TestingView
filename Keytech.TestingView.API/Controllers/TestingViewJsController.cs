using Keytech.TestingView.API.Processing;
using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.API.Controllers
{
    [ApiController]
    [Route("app")]
    public class TestingViewJsController : ControllerBase
    {
        [HttpGet("src/{folder?}")]
        public Task<string> GetSource(string folder = "", CancellationToken cancellationToken = default)
        {
            return System.IO.File.ReadAllTextAsync(Path.Combine(folder, "app.js"), cancellationToken);
        }

        [HttpGet("compile")]
        public async Task CompileJs([FromQuery] bool debug = false)
        {
            await SrcCompilation.MinimizeLoc(Path.Combine(AppContext.BaseDirectory, "wwwroot", "config"));
            await SrcCompilation.MinimizeCss(Path.Combine(AppContext.BaseDirectory, "wwwroot", "css"));
            await SrcCompilation.CompileJs(Path.Combine(AppContext.BaseDirectory, "wwwroot", "js"), !debug);
        }

        [HttpPost("proxy")]
        public async Task<IActionResult> ForwardCall([FromHeader] string address, [FromHeader] string method)
        {
            using var httpClient = new HttpClient();
            ProxyFileLog.Info($"Incoming proxy request. Method={method}; Address={address}; ContentType={Request.ContentType}; ContentLength={Request.ContentLength}; Headers={string.Join("; ", Request.Headers.Select(header => $"{header.Key}={string.Join(",", header.Value.ToArray())}"))}.");

            try
            {
                string? requestBody = null;

                async Task<StringContent> GetRequestBody()
                {
                    using var reader = new StreamReader(Request.Body);
                    requestBody = await reader.ReadToEndAsync();
                    ProxyFileLog.Info($"Incoming proxy body. Method={method}; Address={address}; Body={ProxyFileLog.Sanitize(requestBody)}.");

                    var content = new StringContent(requestBody);

                    if (!string.IsNullOrWhiteSpace(Request.ContentType))
                    {
                        content.Headers.TryAddWithoutValidation("Content-Type", Request.ContentType);
                    }

                    return content;
                }

                var httpMethod = new HttpMethod(method.ToUpperInvariant());
                var content = httpMethod == HttpMethod.Post || httpMethod == HttpMethod.Put
                    ? await GetRequestBody()
                    : null;

                using var forwardRequest = new HttpRequestMessage
                {
                    Method = httpMethod,
                    RequestUri = new Uri(address),
                    Content = content,
                };

                foreach (var header in Request.Headers)
                {
                    if (header.Key.Equals("address", StringComparison.OrdinalIgnoreCase) ||
                        header.Key.Equals("method", StringComparison.OrdinalIgnoreCase) ||
                        header.Key.Equals("host", StringComparison.OrdinalIgnoreCase) ||
                        header.Key.Equals("content-length", StringComparison.OrdinalIgnoreCase) ||
                        header.Key.Equals("content-type", StringComparison.OrdinalIgnoreCase))
                    {
                        continue;
                    }

                    if (content is not null && header.Key.StartsWith("content-", StringComparison.OrdinalIgnoreCase))
                    {
                        content.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                    }
                    else
                    {
                        forwardRequest.Headers.TryAddWithoutValidation(header.Key, header.Value.ToArray());
                    }
                }

                using HttpResponseMessage response = await httpClient.SendAsync(forwardRequest);
                string responseBody = await response.Content.ReadAsStringAsync();
                ProxyFileLog.Info($"Proxy response. Method={method}; Address={address}; Status={(int)response.StatusCode} {response.StatusCode}; ResponseBody={ProxyFileLog.Sanitize(responseBody)}.");

                if (!response.IsSuccessStatusCode)
                {
                    App.Log($"[app/proxy] Forwarded API call returned {(int)response.StatusCode} ({response.StatusCode}) for {method?.ToUpperInvariant()} {address}. Response: {responseBody}", LogLevel.Error);
                }

                return StatusCode((int)response.StatusCode, responseBody);
            }
            catch (Exception e)
            {
                ProxyFileLog.Exception(e, $"Proxy request failed. Method={method}; Address={address}.");
                App.Log($"[app/proxy] Forwarded API call failed for {method?.ToUpperInvariant()} {address}. Error: {e}", LogLevel.Error);
                throw;
            }
        }
    }
}
