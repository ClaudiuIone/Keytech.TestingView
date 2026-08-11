using Microsoft.Extensions.Logging;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public UISchema UI { get; }

        public partial class UISchema
        {
            private readonly TestingViewContext _db;

            public UISchema(TestingViewContext db)
            {
                _db = db;
            }

            private void Log(string info, LogLevel logLevel = LogLevel.Trace)
            {
                _db.Log($"[UI] {info}", logLevel);
            }
        }
    }
}