using Microsoft.Extensions.Logging;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public ProcessingSchema Processing { get; }

        public partial class ProcessingSchema
        {
            private readonly TestingViewContext _db;

            public ProcessingSchema(TestingViewContext db)
            {
                _db = db;
            }

            private void Log(string info, LogLevel logLevel = LogLevel.Trace)
            {
                _db.Log($"[Processing] {info}", logLevel);
            }
        }
    }
}