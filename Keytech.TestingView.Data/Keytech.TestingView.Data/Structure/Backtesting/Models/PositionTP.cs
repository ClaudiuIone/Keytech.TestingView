using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Backtesting
{
    public partial class PositionTP : TestingViewEntity
    {
        public string PositionId { get; set; }
        public double TP { get; set; }
        public DateTimeOffset BarTime { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Data.Backtesting.PositionTP> PositionTPs { get; set; }
        }
    }
}
