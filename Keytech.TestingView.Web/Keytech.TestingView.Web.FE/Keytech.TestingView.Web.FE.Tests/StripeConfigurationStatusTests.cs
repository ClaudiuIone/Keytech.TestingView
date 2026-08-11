using Keytech.TestingView.Web.FE.Configuration;
using Keytech.TestingView.Web.FE.Services;
using Xunit;

namespace Keytech.TestingView.Web.FE.Tests;

public class StripeConfigurationStatusTests
{
    [Fact]
    public void Org_key_requires_account_id_for_checkout()
    {
        var status = StripeConfigurationStatus.Evaluate(
            new StripeOptions { SecretKey = "sk_org_live_test" },
            new SiteOptions { BaseUrl = "https://testingview.com" });

        Assert.False(status.CheckoutReady);
        Assert.True(status.RequiresAccountId);
    }

    [Fact]
    public void Org_key_with_account_is_checkout_ready()
    {
        var status = StripeConfigurationStatus.Evaluate(
            new StripeOptions { SecretKey = "sk_org_live_test", AccountId = "acct_123" },
            new SiteOptions { BaseUrl = "https://testingview.com" });

        Assert.True(status.CheckoutReady);
        Assert.True(status.UsesInlinePriceData);
    }
}
