using System.Text.RegularExpressions;
using Xunit;

namespace Keytech.TestingView.Web.FE.Tests;

public class TradingViewUsernameValidationTests
{
    [Theory]
    [InlineData("trader_joe", true)]
    [InlineData("User123", true)]
    [InlineData("bad name", false)]
    [InlineData("", false)]
    public void Username_pattern(string username, bool valid)
    {
        var ok = !string.IsNullOrWhiteSpace(username) && Regex.IsMatch(username, @"^[a-zA-Z0-9_]+$");
        Assert.Equal(valid, ok);
    }
}
