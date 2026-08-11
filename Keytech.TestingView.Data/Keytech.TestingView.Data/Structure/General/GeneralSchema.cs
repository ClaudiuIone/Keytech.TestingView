using Microsoft.Extensions.Logging;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public GeneralSchema General { get; }

        public partial class GeneralSchema
        {
            private readonly TestingViewContext _db;

            public GeneralSchema(TestingViewContext db)
            {
                _db = db;
                _db.Settings = new GeneralSchema.ParameterValues(_db);
            }

            private void Log(string info, LogLevel logLevel = LogLevel.Trace)
            {
                _db.Log($"[General] {info}", logLevel);
            }
        }
    }
}