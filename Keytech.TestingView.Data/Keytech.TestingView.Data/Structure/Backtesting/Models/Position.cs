using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Backtesting
{
    public partial class Position : TestingViewEntity
    {
        public string PositionId { get; set; }
        public int SymbolId { get; set; }
        public Guid SessionId { get; set; }
        public double Quantity { get; set; }
        public double EntryPrice { get; set; }
        public DateTimeOffset EntryTime { get; set; }
        public double EntryCurrencyRate { get; set; }
        public double? ExitPrice { get; set; }
        public DateTimeOffset? ExitTime { get; set; }
        public short? ExitReason { get; set; }

        public Backtesting.Symbol Symbol { get; set; }
        public List<Backtesting.PositionSL> PositionSLs { get; set; }
        public List<Backtesting.PositionTP> PositionTPs { get; set; }
        public List<Backtesting.PositionBE> PositionBEs { get; set; }
        public List<Backtesting.PositionRisk> PositionRisks { get; set; }
        public List<Journaling.PositionColumn> PositionColumns { get; set; }
        public List<Backtesting.PositionShape> PositionShapes { get; set; }
        public List<Journaling.PositionSnapshot> PositionSnapshots { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Data.Backtesting.Position> Positions { get; set; }
        }
    }
}
