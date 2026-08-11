using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Backtesting
{
    public partial class SymbolRuleContractSize : TestingViewEntity
    {
        public int SymbolRuleId { get; set; }
        public string SymbolType { get; set; }
        public string SymbolNameRegex { get; set; }
        public short Priority { get; set; }
        public double ContractSize { get; set; }
        public double PointSize { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class BacktestingSchema
        {
            public List<Data.Backtesting.SymbolRuleContractSize> SymbolRuleContractSizes { get; set; }
        }
    }
}
