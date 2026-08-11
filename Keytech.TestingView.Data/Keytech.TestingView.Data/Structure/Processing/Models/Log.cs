using System.Collections.Generic;
using Keytech.Framework.Data;
using Microsoft.Extensions.Logging;

namespace Keytech.TestingView.Data.Processing
{
    public partial class Log : KeytechEntity
    {
        public long LogId { get; set; }
        public string Info { get; set; }
        public LogLevel LogLevel { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class ProcessingSchema
        {
            public List<Data.Processing.Log> Logs { get; set; }
        }
    }
}