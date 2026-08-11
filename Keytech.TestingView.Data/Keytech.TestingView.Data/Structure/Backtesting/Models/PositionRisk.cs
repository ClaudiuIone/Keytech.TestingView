using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Backtesting
{
    public partial class PositionRisk : TestingViewEntity
    {
        public string PositionId { get; set; }
        public double Risk { get; set; }
        public DateTimeOffset BarTime { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Data.Backtesting.PositionRisk> PositionRisks { get; set; }
        }
    }
}
