using Keytech.Framework.Data;
using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Administration
{

    public partial class Plan : KeytechEntity
    {
        public static Guid None = Guid.Empty;
        public static Guid Starter = new Guid("926563C2-0644-44A9-B7BB-374EBAD41209");
        public static Guid Explorer = new Guid("749FBCEF-E865-4F15-9CEB-9D99A02301DD");
        public static Guid Trader = new Guid("1BD92829-0577-4177-9B7A-0A9B0E8DD4ED");

        public Guid PlanId { get; set; }
        public string Name { get; set; }
        public short Priority { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class AdministrationSchema
        {
            public List<Data.Administration.Plan> Plans { get; set; }
        }
    }
}
