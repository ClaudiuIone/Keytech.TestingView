namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public WebSchema Web { get; }

        public partial class WebSchema
        {
            private readonly TestingViewContext _db;

            public WebSchema(TestingViewContext db)
            {
                _db = db;
            }
        }
    }
}
