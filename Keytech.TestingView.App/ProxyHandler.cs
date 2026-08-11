using System.Net;
using Titanium.Web.Proxy;
using Titanium.Web.Proxy.EventArguments;
using Titanium.Web.Proxy.Models;
using System.Diagnostics;
using Titanium.Web.Proxy.Exceptions;
using System.Text.RegularExpressions;

namespace Keytech.TestingView.App
{
    internal static class ProxyHandler
    {
        public static HttpClient _httpClient = new HttpClient();

        public static void CreateProxy()
        {
            var proxyServer = new ProxyServer();
            proxyServer.ExceptionFunc = async exception =>
            {
                if (exception is ProxyHttpException phex)
                    Debug.WriteLine(exception.Message + ": " + phex.InnerException?.Message);
                else
                    Debug.WriteLine(exception.Message);
            };

            proxyServer.TcpTimeWaitSeconds = 10;
            proxyServer.ConnectionTimeOutSeconds = 15;
            proxyServer.ReuseSocket = false;
            proxyServer.EnableConnectionPool = false;
            proxyServer.ForwardToUpstreamGateway = true;
            proxyServer.CertificateManager.SaveFakeCertificates = true;
            proxyServer.BeforeRequest += OnRequest;
            proxyServer.BeforeResponse += OnResponse;

            var explicitEndPoint = new ExplicitProxyEndPoint(IPAddress.Any, 8888);
            proxyServer.AddEndPoint(explicitEndPoint);
            proxyServer.Start();
        }

        private static async Task OnRequest(object sender, SessionEventArgs e)
        {
            if (e.HttpClient.Request.Url.Contains("testingview.com/app/proxy", StringComparison.InvariantCultureIgnoreCase))
            {
                if (e.HttpClient.Request.Method == "POST")
                {
                    byte[] requestBody = await e.GetRequestBody();
                    HttpResponseMessage newRequest = await _httpClient.PostAsync("http://69.197.174.151/signal", new ByteArrayContent(requestBody));
                    e.Ok("OKP");
                }
            }
        }

        private static async Task OnResponse(object sender, SessionEventArgs e)
        {
            if (e.HttpClient.Request.Url.Contains("tradingview.com/chart", StringComparison.InvariantCultureIgnoreCase))
            {
                string originalContent= null;
                string TestingViewJs = null;

                await Task.WhenAll(
                    e.GetResponseBodyAsString().ContinueWith(t => originalContent = t.Result),
                    _httpClient.GetStringAsync("https://js.testingview.com/app/src").ContinueWith(t => TestingViewJs = t.Result)
                    );

                var match = Regex.Match(originalContent, @"<script[^>]*?nonce\s*=\s*[""']([^""']+)[""']", RegexOptions.IgnoreCase);
                string nonce = match.Groups[1].Value;

                e.SetResponseBodyString(originalContent.Replace("</html>", $"<script nonce='{nonce}'>{TestingViewJs}</script></html>", StringComparison.InvariantCultureIgnoreCase));
            }
        }
    }
}
