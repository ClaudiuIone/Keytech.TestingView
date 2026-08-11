using System;
using System.Collections.Generic;

using System;
using Keytech.Framework.Data;

namespace Keytech.TestingView.Data.Backtesting
{
    public partial class SessionSymbolLastPrice : KeytechEntity
    {
        public Guid SessionId { get; set; }
        public int SymbolId { get; set; }
        public double LastPrice { get; set; }
        public DateTimeOffset LastUpdate { get; set; }
        public DateTimeOffset CreationDate { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Data.Backtesting.SessionSymbolLastPrice> SessionSymbolLastPrices { get; set; }
        }
    }
}
