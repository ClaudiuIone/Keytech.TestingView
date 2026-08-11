using Keytech.TestingView.Web.FE.Configuration;
using Stripe;

namespace Keytech.TestingView.Web.FE.Services;

public static class StripeRequestOptionsFactory
{
    public static RequestOptions? Create(StripeOptions options)
    {
        if (string.IsNullOrWhiteSpace(options.AccountId)) return null;

        var context = options.AccountId.Trim();
        if (RequiresAccountId(options))
            return new RequestOptions { StripeContext = context };

        return context.Contains('/')
            ? new RequestOptions { StripeContext = context }
            : new RequestOptions { StripeAccount = context };
    }

    public static bool RequiresAccountId(StripeOptions options) =>
        options.SecretKey.StartsWith("sk_org_", StringComparison.OrdinalIgnoreCase);

    public static void ApplyApiKey(StripeOptions options)
    {
        if (!string.IsNullOrWhiteSpace(options.SecretKey))
            StripeConfiguration.ApiKey = options.SecretKey;
    }
}
