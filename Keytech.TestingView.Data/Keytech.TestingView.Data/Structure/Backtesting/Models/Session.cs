using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Backtesting
{
    public partial class Session : TestingViewEntity
    {
        public Guid SessionId { get; set; }
        public Guid UserId { get; set; }
        public string Name { get; set; }
        public double Capital { get; set; }
        public double Equity { get; set; }
        public string CurrencyId { get; set; }
        public DateTimeOffset CurrentDate { get; set; }
        public DateTimeOffset? RandomizedStartDate { get; set; }
        public DateTimeOffset? RandomizedEndDate { get; set; }
        public bool IsDeleted { get; set; }
        public DateTimeOffset LastUpdate { get; set; }
        public List<Data.Journaling.SessionColumn> SessionColumns { get; set; }
        public List<Data.Backtesting.SessionParameter> SessionParameters { get; set; }
        public List<Data.Backtesting.SessionSymbolLastPrice> SessionSymbolLastPrices { get; set; }
        public List<Data.Backtesting.Position> Positions { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Data.Backtesting.Session> Sessions { get; set; }
        }
    }
}
