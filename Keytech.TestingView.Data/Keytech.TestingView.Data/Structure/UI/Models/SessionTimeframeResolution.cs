using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.UI
{
    public partial class SessionTimeframeResolution : TestingViewEntity
    {
        public Guid SessionId { get; set; }
        public int TimeframeSeconds { get; set; }
        public bool IsFastForward { get; set; }
        public string Resolution { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class UISchema
        {
            public List<Data.UI.SessionTimeframeResolution> SessionTimeframeResolutions { get; set; }
        }
    }
}