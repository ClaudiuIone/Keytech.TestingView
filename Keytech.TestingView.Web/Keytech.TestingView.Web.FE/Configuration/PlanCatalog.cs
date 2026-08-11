using Keytech.TestingView.Data.Administration;

namespace Keytech.TestingView.Web.FE.Configuration;

public static class PlanCatalog
{
    public static readonly Guid Starter = Plan.Starter;
    public static readonly Guid Explorer = Plan.Explorer;
    public static readonly Guid Trader = Plan.Trader;
    public static readonly Guid None = Plan.None;

    public static readonly IReadOnlyList<PlanDefinition> Plans =
    [
        new(Starter, "Starter", 0m, null, "starter-plan.jpg", false,
            [
                "Resume saved backtesting sessions",
                "Core sessions, trades, and journaling",
                "Up to 20 trades per session",
                "Up to 10 Go to Time jumps per session",
            ]),
        new(Explorer, "Explorer", 7.99m, 7, "edge-plan.jpg", false,
            [
                "Everything in Starter",
                "Up to 50 trades per session",
                "Automatic break-even",
                "Advanced performance metrics",
                "Custom journal columns",
                "Unlimited Go to Time per session",
            ]),
        new(Trader, "Trader", 9.99m, 14, "master-plan.jpg", true,
            [
                "Everything in Explorer",
                "Unlimited trades per session",
                "Multiple backtesting sessions",
                "Journal export to Excel",
                "Slippage & spread modeling",
                "Edit position quantity after entry",
            ]),
    ];

    public static PlanDefinition? GetById(Guid planId) => Plans.FirstOrDefault(p => p.PlanId == planId);

    public static Guid? GetPlanIdByStripePrice(string? priceId, StripeOptions options)
    {
        if (string.IsNullOrEmpty(priceId)) return null;
        if (priceId == options.ExplorerPriceId) return Explorer;
        if (priceId == options.TraderPriceId) return Trader;
        return null;
    }
}

public record PlanDefinition(
    Guid PlanId,
    string Name,
    decimal MonthlyPrice,
    int? TrialDays,
    string ImageFile,
    bool Recommended,
    IReadOnlyList<string> Benefits);
