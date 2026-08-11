using Microsoft.Extensions.Logging;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public BacktestingSchema Backtesting { get; }

        public partial class BacktestingSchema
        {
            private readonly TestingViewContext _db;

            public BacktestingSchema(TestingViewContext db)
            {
                _db = db;
            }

            private void Log(string info, LogLevel logLevel = LogLevel.Trace)
            {
                _db.Log($"[Backtesting] {info}", logLevel);
            }
        }
    }
}