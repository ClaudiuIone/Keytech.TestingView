using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Journaling
{
    public partial class PositionSnapshot : TestingViewEntity
    {
        public string PositionId { get; set; }
        public short Priority { get; set; }
        public string SnapshotUrl { get; set; }
        public DateTimeOffset SessionTime { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class JournalingSchema
        {
            public List<Data.Journaling.PositionSnapshot> PositionSnapshots { get; set; }
        }
    }
}
