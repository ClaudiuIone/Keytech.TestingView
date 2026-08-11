namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public AdministrationSchema Administration { get; }

        public partial class AdministrationSchema
        {
            private readonly TestingViewContext _db;

            public AdministrationSchema(TestingViewContext db)
            {
                _db = db;
            }

            private void Log(string info)
            {
                _db.Log($"[Administration] {info}");
            }
        }
    }
}