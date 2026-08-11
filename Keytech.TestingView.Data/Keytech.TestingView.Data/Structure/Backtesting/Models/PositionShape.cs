using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Backtesting
{
    public partial class PositionShape : TestingViewEntity
    {
        public string PositionId { get; set; }
        public string ShapeId { get; set; }
        public string Name { get; set; }
        public DateTimeOffset EndTime { get; set; }
        public double StopPrice { get; set; }
        public double TargetPrice { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Data.Backtesting.PositionShape> PositionShapes { get; set; }
        }
    }
}
