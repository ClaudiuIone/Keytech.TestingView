using Microsoft.Extensions.Logging;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public JournalingSchema Journaling { get; }

        public partial class JournalingSchema
        {
            private readonly TestingViewContext _db;

            public JournalingSchema(TestingViewContext db)
            {
                _db = db;
            }

            private void Log(string info, LogLevel logLevel = LogLevel.Trace)
            {
                _db.Log($"[JournalingSchema] {info}", logLevel);
            }
        }
    }
}