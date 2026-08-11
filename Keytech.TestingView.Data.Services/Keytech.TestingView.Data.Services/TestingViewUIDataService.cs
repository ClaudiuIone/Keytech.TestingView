using Keytech.TestingView.Data;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace Keytech.TestingView.Data.Services
{
    public class TestingViewUIDataService : TestingViewDataService
    {
        protected TestingViewUIDataService(TestingViewContext TestingViewDb) : base(TestingViewDb)
        {
        }

        public async static Task<TestingViewUIDataService> CreateService(string TestingViewConnectionString)
        {
            TestingViewContext TestingViewDb = await TestingViewContext.CreateDb(TestingViewConnectionString);
            return new TestingViewUIDataService(TestingViewDb);
        }

        public IAsyncEnumerable<Data.UI.SessionTimeframeResolution> GetSessionTimeframeResolutions(Guid sessionId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.UI.GetSessionTimeframeResolutions(sessionId, cancellationToken);
        }

        public Task<int> SetSessionTimeframeResolution(Guid sessionId, int timeframeSeconds, string resolution)
        {
            return _TestingViewDb.UI.SetSessionTimeframeResolution(sessionId, timeframeSeconds, resolution);
        }

        public Task<int> SetSessionTimeframeFastForwardResolution(Guid sessionId, int timeframeSeconds, string resolution)
        {
            return _TestingViewDb.UI.SetSessionTimeframeFastForwardResolution(sessionId, timeframeSeconds, resolution);
        }

        protected override void Log(string info, LogLevel logLevel = LogLevel.Trace)
        {
            base.Log($"[{nameof(TestingViewUIDataService)}] {info}", logLevel);
        }
    }
}
