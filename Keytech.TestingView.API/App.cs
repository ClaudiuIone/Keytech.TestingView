using Keytech.Framework.Core.Helpers;
using Keytech.Framework.Data;
using Keytech.TestingView.Data.Services;
using Keytech.TestingView.Data;

namespace Keytech.TestingView.API
{
    internal static class App
    {
        private static TestingViewContext _TestingViewDb;

        public static TestingViewBacktestingDataService TestingViewBacktestingDataService { get; private set; }
        public static TestingViewJournalingDataService TestingViewJournalingDataService { get; private set; }
        public static TestingViewAdminDataService TestingViewAdminDataService { get; private set; }
        public static TestingViewUIDataService TestingViewUIDataService { get; private set; }
        
        internal static async Task Initialize()
        {
            Keytech.TestingView.Extension.Provider.EnsureExecution();

            _TestingViewDb = await TestingViewContext.CreateDb(TestingViewApiSettings.Current.ConnectionStrings.TestingView);
            _TestingViewDb.Logging += (KeytechContext db, string info, LogLevel logLevel) => App.Log(info, logLevel);

            App.TestingViewUIDataService = await TestingViewUIDataService.CreateService(TestingViewApiSettings.Current.ConnectionStrings.TestingView);
            App.TestingViewUIDataService.Logging += App.Log;

            App.TestingViewJournalingDataService = await TestingViewJournalingDataService.CreateService(TestingViewApiSettings.Current.ConnectionStrings.TestingView);
            App.TestingViewJournalingDataService.Logging += App.Log;

            App.TestingViewBacktestingDataService = await TestingViewBacktestingDataService.CreateService(TestingViewApiSettings.Current.ConnectionStrings.TestingView, App.TestingViewJournalingDataService, App.TestingViewUIDataService);
            App.TestingViewBacktestingDataService.Logging += App.Log;

            App.TestingViewAdminDataService = await TestingViewAdminDataService.CreateService(TestingViewApiSettings.Current.ConnectionStrings.TestingView);
            App.TestingViewAdminDataService.Logging += App.Log;

        }

        internal static async Task WaitForLogs()
        {
            await Task.Delay(10000);
        }

        internal static async void Log(string info, LogLevel logLevel = LogLevel.Information)
        {
            if (logLevel >= await _TestingViewDb.Settings.GetLogLevel())
            {
                Console.WriteLine($"[{DateTimeOffset.Now.ToString(StringOperations.SortableDateFormat)}] {info}");
                await Execution.Try(() => _TestingViewDb.Processing.InsertLog(info, logLevel));
            }
        }
    }
}
