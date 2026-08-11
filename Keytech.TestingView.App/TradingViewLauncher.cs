using System;
using System.Diagnostics;
using System.IO;
using System.Runtime.InteropServices;

namespace Keytech.TestingView.App
{
    public static class TradingViewLauncher
    {
        public static async Task Launch(string arguments)
        {
            if (RuntimeInformation.IsOSPlatform(OSPlatform.Windows))
            {
                await LaunchOnWindows(arguments);
            }
            else if (RuntimeInformation.IsOSPlatform(OSPlatform.OSX))
            {
                await LaunchOnMac(arguments);
            }
            else
            {
                await LaunchOnLinux(arguments);
            }
        }

        private static async Task LaunchOnWindows(string arguments)
        {
            string appId = null;

            var psi = new ProcessStartInfo
            {
                FileName = "powershell",
                Arguments = "-Command \"Get-StartApps | Where-Object { $_.Name -like '*TradingView*' } | Select-Object -ExpandProperty AppID\"",
                RedirectStandardOutput = true,
                UseShellExecute = false,
                CreateNoWindow = true
            };

            using (var process = Process.Start(psi))
            {
                using var reader = process.StandardOutput;
                while (!reader.EndOfStream)
                {
                    var line = reader.ReadLine()?.Trim();
                    if (!string.IsNullOrEmpty(line) && line.Contains("!") && line.Contains(".Desktop"))
                    {
                        appId = line;
                        break;
                    }
                }
                process.WaitForExit();
            }

            if (string.IsNullOrEmpty(appId))
            {
                throw new Exception("Could not find TradingView App");
            }

            await Process.Start(new ProcessStartInfo
            {
                FileName = "cmd.exe",
                Arguments = $"/c start /WAIT /B shell:AppsFolder\\{appId} {arguments}",
                UseShellExecute = false,
                CreateNoWindow = true,
                WindowStyle = ProcessWindowStyle.Hidden
            }).WaitForExitAsync();
        }

        private static async Task LaunchOnMac(string arguments)
        {
            const string appPath = "/Applications/TradingView.app";

            if (Directory.Exists(appPath))
            {
                await Process.Start("open", $"-a \"{appPath}\" \"${arguments}\"").WaitForExitAsync();
            }
            else
            {
                throw new Exception("Could not find TradingView App");
            }
        }

        private static async Task LaunchOnLinux(string arguments)
        {
            string[] candidates =
            {
                "/usr/bin/tradingview",
                "/usr/local/bin/tradingview",
                Environment.GetFolderPath(Environment.SpecialFolder.UserProfile) + "/AppImages/TradingView.AppImage"
            };

            foreach (var path in candidates)
            {
                if (File.Exists(path))
                {
                    await Process.Start("bash", $"-c \"'{path}' '${arguments}' &\"").WaitForExitAsync();
                    return;
                }
            }

            throw new Exception("Could not find TradingView App");
        }
    }
}
