using System;
using System.Threading.Tasks;
using Keytech.Framework.Core.Extensions;
using Keytech.Framework.Core.Helpers;
using Keytech.Framework.Data;
using Keytech.TestingView.Data;
using Microsoft.Extensions.Logging;

namespace Keytech.TestingView.Data.Services
{
    public class TestingViewDataService
    {
        protected readonly TestingViewContext _TestingViewDb;

        public event Action<string, LogLevel> Logging;

        protected TestingViewDataService(TestingViewContext TestingViewDb)
        {
            _TestingViewDb = TestingViewDb;
            _TestingViewDb.Logging += (KeytechContext db, string info, LogLevel logLevel) => this.Log(info, logLevel);
        }

        /// <summary>
        /// Additional backup layer for retrying when connections are closed
        /// </summary>
        private Task<T> Try<T>(Task<T> action, string errorMessage)
        {
            return Execution.Try(() => action,
                onError: (int retryCount, Exception e) =>
                {
                    this.Log($"{errorMessage}: {e.GetDetails()}", LogLevel.Error);
                    return Task.Delay(250);
                },
                maxRetries: 1,
                expectedExceptionTypes: new[] { typeof(InvalidOperationException) },
                ignoreErrors: false);
        }

        protected virtual void Log(string info, LogLevel logLevel = LogLevel.Trace)
        {
            this.Logging?.Invoke(info, logLevel);
        }
    }
}
