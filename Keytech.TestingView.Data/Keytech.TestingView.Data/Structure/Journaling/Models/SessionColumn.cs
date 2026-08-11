using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Journaling
{
    public partial class SessionColumn : TestingViewEntity
    {
        public Guid SessionId { get; set; }
        public short Priority{ get; set; }
        public int ColumnId { get; set; }
        public string ColumnName { get; set; }
        public string ColumnType { get; set; }
        public string ColumnEnumValues { get; set; }
        public bool Sortable { get; set; }
        public bool Visible { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class JournalingSchema
        {
            public List<Data.Journaling.SessionColumn> SessionColumns { get; set; }
        }
    }
}
