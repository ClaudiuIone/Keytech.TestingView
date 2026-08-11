using Keytech.TestingView.Data;

namespace Keytech.TestingView.Web.FE.Services;

public class TestingViewDb
{
    private readonly string _connectionString;

    public TestingViewDb(IConfiguration configuration)
    {
        _connectionString = configuration.GetConnectionString("TestingView")
            ?? throw new InvalidOperationException("Connection string 'TestingView' is not configured.");
    }

    public async Task<TestingViewContext> OpenAsync(CancellationToken cancellationToken = default)
    {
        return await TestingViewContext.CreateDb(_connectionString);
    }
}
