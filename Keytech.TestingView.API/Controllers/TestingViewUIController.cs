using Keytech.TestingView.Data.UI;
using Keytech.Framework.Core.Helpers;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc;

namespace Keytech.TestingView.API.Controllers
{
    [ApiController]
    [Route("ui")]
    public class TestingViewUIController : ControllerBase
    {
        [HttpGet("extension")]
        public IActionResult RedirectBasedOnBrowser()
        {
            var userAgent = Request.Headers["User-Agent"].ToString();

            if (userAgent.Contains("Edg", StringComparison.OrdinalIgnoreCase))
            {
                return Redirect("https://microsoftedge.microsoft.com/addons/detail/testingviewcom-trading/dgdmaikclacjjahegiiocihglciaclfh?utm_source=api");
            }
            else if (userAgent.Contains("Firefox", StringComparison.OrdinalIgnoreCase))
            {
                return Redirect("https://addons.mozilla.org/en-US/firefox/addon/testingview/?utm_source=api");
            }
            else if (userAgent.Contains("Safari", StringComparison.OrdinalIgnoreCase))
            {
                return Redirect("https://chromewebstore.google.com/detail/testingviewcom-tradingvi/hbbkodlaakiaednefgdbinpkfgfbpall?utm_source=api");
            }
            else if (userAgent.Contains("Opera", StringComparison.OrdinalIgnoreCase))
            {
                return Redirect("https://chromewebstore.google.com/detail/testingviewcom-tradingvi/hbbkodlaakiaednefgdbinpkfgfbpall?utm_source=api");
            }
            else
            {
                return Redirect("https://chromewebstore.google.com/detail/testingviewcom-tradingvi/hbbkodlaakiaednefgdbinpkfgfbpall?utm_source=api");
            }
        }

        [HttpGet("refresh-state")]
        public object GetRefreshState([FromQuery] int clientVersion = 0)
        {
            if(clientVersion > Program.Version)
            {
                Program.Version = clientVersion;
            }

            return new
            {
                shouldRefresh = Program.Version > clientVersion,
                serverVersion = Program.Version
            };
        }

        [HttpGet("sessions/{sessionId}/timeframe-resolutions")]
        public IAsyncEnumerable<SessionTimeframeResolution> GetSessionTimeframeResolutions(Guid sessionId, CancellationToken cancellationToken)
        {
            return App.TestingViewUIDataService.GetSessionTimeframeResolutions(sessionId, cancellationToken);
        }

        [HttpPut("sessions/{sessionId}/timeframe-resolutions/{timeframeSeconds}")]
        public Task<int> SetSessionTimeframeResolution(Guid sessionId, int timeframeSeconds, [FromBody] string resolution)
        {
            return App.TestingViewUIDataService.SetSessionTimeframeResolution(sessionId, timeframeSeconds, resolution);
        }

        [HttpPut("sessions/{sessionId}/ff-timeframe-resolutions/{timeframeSeconds}")]
        public Task<int> SetSessionTimeframeFastForwardResolution(Guid sessionId, int timeframeSeconds, [FromBody] string resolution)
        {
            return App.TestingViewUIDataService.SetSessionTimeframeFastForwardResolution(sessionId, timeframeSeconds, resolution);
        }

        [HttpGet("addons")]
        public string[] GetAddons(string username)
        {
            switch (username)
            {
                case "BacktestingMaestro":
                    {
                        return
                        [
                            "cstrat.live",
                            "tradovate.live",
                            "testingview.extend",
                            "mt5copier",
                            "notes",
                        ];
                    }
                case "LazarDan1818":
                    {
                        return
                        [
                            "cstrat.live",
                            "testingview.extend",
                            "mt5copier",
                            "notes",
                        ];
                    }
                default:
                    { 
                        return
                        [
                            "notes",
                        ];
                    }
            }
        }
    }
}
