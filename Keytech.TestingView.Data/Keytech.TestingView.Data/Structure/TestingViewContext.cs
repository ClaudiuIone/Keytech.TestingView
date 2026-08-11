using Keytech.Framework.Data;
using System.Threading.Tasks;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext : KeytechContext
    {
        private TestingViewContext(string connectionString) : base(connectionString)
        {
            this.Administration = new AdministrationSchema(this);
            this.General = new GeneralSchema(this);
            this.Backtesting = new BacktestingSchema(this);
            this.Journaling = new JournalingSchema(this);
            this.Processing = new ProcessingSchema(this);
            this.UI = new UISchema(this);
            this.Web = new WebSchema(this);
        }

        public static async Task<TestingViewContext> CreateDb(string connectionString)
        {
            return new TestingViewContext(connectionString);
        }
    }
}
