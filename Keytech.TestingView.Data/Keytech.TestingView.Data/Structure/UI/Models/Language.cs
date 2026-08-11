using System.Collections.Generic;

namespace Keytech.TestingView.Data.UI
{
    public partial class Language : TestingViewEntity
    {
        public string LanguageCode { get; set; }
        public string Name { get; set; }
        public List<Data.Administration.User> Users { get; set; }
    }
}

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class UISchema
        {
            public List<Data.UI.Language> Languages { get; set; }
        }
    }
}
