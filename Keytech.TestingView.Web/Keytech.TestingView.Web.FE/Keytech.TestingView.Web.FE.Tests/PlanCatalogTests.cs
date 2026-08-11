using Keytech.TestingView.Web.FE.Configuration;
using Xunit;

namespace Keytech.TestingView.Web.FE.Tests;

public class PlanCatalogTests
{
    [Fact]
    public void Plans_include_starter_explorer_trader()
    {
        Assert.Equal(3, PlanCatalog.Plans.Count);
        Assert.Contains(PlanCatalog.Plans, p => p.Name == "Starter" && p.MonthlyPrice == 0);
        Assert.Contains(PlanCatalog.Plans, p => p.Name == "Explorer" && p.MonthlyPrice == 7.99m);
        Assert.Contains(PlanCatalog.Plans, p => p.Name == "Trader" && p.MonthlyPrice == 9.99m);
    }

    [Fact]
    public void GetById_returns_plan()
    {
        var explorer = PlanCatalog.GetById(PlanCatalog.Explorer);
        Assert.NotNull(explorer);
        Assert.Equal("Explorer", explorer!.Name);
    }
}
