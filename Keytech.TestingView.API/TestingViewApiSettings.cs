using Keytech.Framework.Services.Helpers;

namespace Keytech.TestingView.API
{
    public class TestingViewApiSettings : AppSettings<TestingViewApiSettings>
    {
        public class ConnectionStringConfiguration
        {
            public string TestingView { get; set; }
        }

        public ConnectionStringConfiguration ConnectionStrings { get; set; }
    }
}
