using Microsoft.AspNetCore.Mvc;
using System.Collections.Concurrent;

namespace Keytech.TestingView.API.Controllers
{
    [ApiController]
    [Route("gpt")]
    public class TestingViewGptController : ControllerBase
    {
        private const int MaxImagesPerQueue = 1000;
        private static readonly ConcurrentDictionary<string, List<ImageData>> ImageQueue = new(StringComparer.OrdinalIgnoreCase);
        private readonly IConfiguration _configuration;

        public TestingViewGptController(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public class ImageData
        {
            public string User { get; set; } = "";
            public string Base64 { get; set; } = "";
            public string FileName { get; set; } = "";
            public string MimeType { get; set; } = "image/png";
            public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        }

        public class AnalyzeImageRequest
        {
            public string Symbol { get; set; } = "";
            public string ImageBase64 { get; set; } = "";
            public string FileName { get; set; } = "";
            public string MimeType { get; set; } = "image/png";
        }

        [HttpPost("analyze-image")]
        public IActionResult AnalyzeImage([FromBody] AnalyzeImageRequest request)
        {
            if (!TryGetAcceptedUser(out string user, out IActionResult rejection))
            {
                return rejection;
            }

            if (string.IsNullOrWhiteSpace(request.Symbol))
            {
                return BadRequest("Symbol is required");
            }

            if (string.IsNullOrWhiteSpace(request.ImageBase64))
            {
                return BadRequest("Image data is required");
            }

            string symbol = NormalizeSymbol(request.Symbol);
            var imageData = new ImageData
            {
                User = user,
                Base64 = request.ImageBase64,
                FileName = string.IsNullOrWhiteSpace(request.FileName)
                    ? $"SNAPSHOT_{DateTime.UtcNow:yyyyMMdd_HHmmss}.png"
                    : request.FileName.ToUpperInvariant(),
                MimeType = string.IsNullOrWhiteSpace(request.MimeType)
                    ? "image/png"
                    : request.MimeType,
                Timestamp = DateTime.UtcNow
            };

            var queue = ImageQueue.GetOrAdd(BuildQueueKey(user, symbol), _ => new List<ImageData>());
            lock (queue)
            {
                queue.Add(imageData);
                while (queue.Count > MaxImagesPerQueue)
                {
                    queue.RemoveAt(0);
                }
            }

            return Ok(new { success = true, message = "Image queued for analysis", user, symbol });
        }

        [HttpGet("image")]
        public IActionResult GetImage([FromQuery] string symbol)
        {
            if (!TryGetAcceptedUser(out string user, out IActionResult rejection))
            {
                return rejection;
            }

            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Symbol is required");
            }

            if (TryGetLatestImage(user, symbol, out ImageData imageData))
            {
                return Ok(new
                {
                    user = imageData.User,
                    success = true,
                    imageBase64 = imageData.Base64,
                    fileName = imageData.FileName.ToUpperInvariant(),
                    mimeType = imageData.MimeType,
                    timestamp = imageData.Timestamp
                });
            }

            return NoContent();
        }

        [HttpPost("image-remove")]
        public IActionResult DeleteImage([FromQuery] string symbol, [FromQuery] string filename)
        {
            if (!TryGetAcceptedUser(out string user, out IActionResult rejection))
            {
                return rejection;
            }

            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Symbol is required");
            }

            if (string.IsNullOrWhiteSpace(filename))
            {
                return BadRequest("Filename is required");
            }

            string key = BuildQueueKey(user, symbol);
            if (ImageQueue.TryGetValue(key, out var queue))
            {
                bool removed;
                lock (queue)
                {
                    removed = queue.RemoveAll(i => string.Equals(i.FileName, filename, StringComparison.OrdinalIgnoreCase)) > 0;
                    if (queue.Count == 0)
                    {
                        ImageQueue.TryRemove(key, out _);
                    }
                }

                if (removed)
                {
                    return Ok();
                }
            }

            return NoContent();
        }

        [HttpGet("image/peek")]
        public IActionResult PeekImage([FromQuery] string symbol)
        {
            if (!TryGetAcceptedUser(out string user, out IActionResult rejection))
            {
                return rejection;
            }

            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Symbol is required");
            }

            if (TryGetLatestImage(user, symbol, out ImageData imageData, out int queueLength))
            {
                return Ok(new
                {
                    success = true,
                    user,
                    hasImage = true,
                    fileName = imageData.FileName.ToUpperInvariant(),
                    timestamp = imageData.Timestamp,
                    queueLength
                });
            }

            return Ok(new { success = true, user, hasImage = false, queueLength });
        }

        [HttpDelete("image")]
        public IActionResult ClearImages([FromQuery] string symbol)
        {
            if (!TryGetAcceptedUser(out string user, out IActionResult rejection))
            {
                return rejection;
            }

            if (string.IsNullOrWhiteSpace(symbol))
            {
                return BadRequest("Symbol is required");
            }

            bool removed = ImageQueue.TryRemove(BuildQueueKey(user, symbol), out _);
            return Ok(new { success = true, message = removed ? "Queue cleared" : "No queue found", user, symbol });
        }

        private bool TryGetAcceptedUser(out string user, out IActionResult rejection)
        {
            user = "";
            if (!Request.Headers.TryGetValue("user", out var value) || string.IsNullOrWhiteSpace(value.ToString()))
            {
                rejection = BadRequest("User header is required");
                return false;
            }

            user = value.ToString().Trim();
            if (!GetAcceptedUsers().Contains(user, StringComparer.OrdinalIgnoreCase))
            {
                rejection = StatusCode(StatusCodes.Status403Forbidden, "User is not accepted");
                return false;
            }

            rejection = NoContent();
            return true;
        }

        private string[] GetAcceptedUsers()
        {
            string[] users = _configuration
                .GetSection("TestingViewGpt:AcceptedUsers")
                .GetChildren()
                .Select(item => item.Value)
                .Where(value => !string.IsNullOrWhiteSpace(value))
                .Select(value => value!)
                .ToArray();
            string? environmentUsers = Environment.GetEnvironmentVariable("TESTINGVIEW_ACCEPTED_USERS");
            if (!string.IsNullOrWhiteSpace(environmentUsers))
            {
                users = environmentUsers
                    .Split([',', ';'], StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
            }

            return users.Where(u => !string.IsNullOrWhiteSpace(u)).ToArray();
        }

        private static bool TryGetLatestImage(string user, string symbol, out ImageData imageData)
        {
            return TryGetLatestImage(user, symbol, out imageData, out _);
        }

        private static bool TryGetLatestImage(string user, string symbol, out ImageData imageData, out int queueLength)
        {
            imageData = new ImageData();
            queueLength = 0;
            if (!ImageQueue.TryGetValue(BuildQueueKey(user, symbol), out var queue))
            {
                return false;
            }

            lock (queue)
            {
                queueLength = queue.Count;
                ImageData? latestImage = queue.LastOrDefault();
                if (latestImage is null)
                {
                    return false;
                }

                imageData = latestImage;
                return true;
            }
        }

        private static string BuildQueueKey(string user, string symbol)
        {
            return $"{user.Trim().ToUpperInvariant()}\n{NormalizeSymbol(symbol)}";
        }

        private static string NormalizeSymbol(string symbol)
        {
            return symbol.Trim().ToUpperInvariant();
        }
    }
}
