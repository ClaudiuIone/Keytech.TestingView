using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text.RegularExpressions;

namespace Keytech.TestingView.App
{
    internal class Program
    {
        static async Task Main()
        {
            ProxyHandler.CreateProxy();
            await TradingViewLauncher.Launch("--proxy-server=localhost:8888 --ignore-certificate-errors --auto-open-devtools-for-tabs");
            while(true)
            {
                await Task.Delay(10000);
                if (Process.GetProcessesByName("TradingView").Length == 0)
                {
                    Console.WriteLine("❌ TradingView desktop application not found.");
                    break;
                }
                else
                {
                    Console.WriteLine("✅ TradingView process is running.");
                }
            }
        }
    }
}
