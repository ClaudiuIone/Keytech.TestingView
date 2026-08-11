using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Backtesting
{
    public partial class PositionSnapshot : TestingViewEntity
    {
        public string PositionId { get; set; }
        public short Priority { get; set; }
        public string SnapshotUrl { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Data.Backtesting.PositionSnapshot> PositionSnapshots { get; set; }
        }
    }
}
