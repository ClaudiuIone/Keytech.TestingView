using System;
using System.Collections.Generic;

namespace Keytech.TestingView.Data.Administration
{
    public partial class User : TestingViewEntity
    {
        public Guid UserId { get; set; }
        public string Email { get; set; }
        public string TradingViewUsername { get; set; }
        public Data.Administration.Plan Plan { get; set; }
        public DateTimeOffset PlanExpiration { get; set; }
        public Data.UI.Language Language { get; set; }
        public string TradingViewUserJson { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class AdministrationSchema
        {
            public List<Data.Administration.User> Users { get; set; }
        }
    }
}
