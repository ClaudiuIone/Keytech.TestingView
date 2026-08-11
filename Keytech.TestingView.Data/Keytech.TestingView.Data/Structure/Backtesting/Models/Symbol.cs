using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Backtesting
{
    public partial class Symbol : TestingViewEntity
    {
        public int SymbolId { get; set; }
        public string SymbolName { get; set; }
        public string SymbolType { get; set; }
        public string CurrencyId { get; set; }
        public short QuantityPrecision { get; set; }
        public short PricePrecision { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Data.Backtesting.Symbol> Symbols { get; set; }
        }
    }
}
