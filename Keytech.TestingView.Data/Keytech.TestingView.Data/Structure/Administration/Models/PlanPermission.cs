using Keytech.Framework.Data;
using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Administration
{
    public partial class PlanPermission : KeytechEntity
    {
        public Guid PlanId { get; set; }
        public string Permission { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class AdministrationSchema
        {
            public List<Data.Administration.PlanPermission> PlanPermissions { get; set; }
        }
    }
}
