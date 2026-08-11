using Keytech.Framework.Data;
using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Backtesting
{
    public enum SessionParameterId : short
    {
        FirstTradeInfo = 1,
        PreventHTFCandlePreviews = 2,
        EnablePredefinedTimes = 3,
        PredefinedTimes = 4,
        ConfirmEntries = 7,
        ShowOpenPositionTip = 8,
        AutoSnapshot = 9,
        CanModifyQty = 10,
        AutoOpenPanel = 11,
        WatchIntegrationPlots = 12,
    }

    public partial class SessionParameter : KeytechEntity
    {
        public Guid SessionId { get; set; }
        public Data.Backtesting.SessionParameterId ParameterId { get; set; }
        public string ParameterValue { get; set; }
    }
}

namespace TCS.Cinemadad.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Keytech.TestingView.Data.Backtesting.SessionParameter> SessionParameters { get; set;}
        }
    }
}
