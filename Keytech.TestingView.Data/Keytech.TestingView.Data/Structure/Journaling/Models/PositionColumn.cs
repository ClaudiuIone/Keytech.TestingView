using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Journaling
{
    public partial class PositionColumn : TestingViewEntity
    {
        public string PositionId { get; set; }
        public int ColumnId { get; set; }
        public string Value { get; set; }
        public DateTimeOffset LastUpdate { get; set; }
        public Data.Journaling.SessionColumn SessionColumn { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class JournalingSchema
        {
            public List<Data.Journaling.PositionColumn> PositionColumns { get; set; }
        }
    }
}
