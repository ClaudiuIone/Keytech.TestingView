using System;

namespace Keytech.TestingView.Data.Web
{
    public class ExternalLogin
    {
        public Guid ExternalLoginId { get; set; }
        public Guid UserId { get; set; }
        public string Provider { get; set; }
        public string ProviderSubject { get; set; }
        public string Email { get; set; }
        public string DisplayName { get; set; }
        public string PictureUrl { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class StripeCustomer
    {
        public string StripeCustomerId { get; set; }
        public Guid UserId { get; set; }
        public string Email { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }

    public class StripeSubscription
    {
        public string StripeSubscriptionId { get; set; }
        public Guid UserId { get; set; }
        public string StripeCustomerId { get; set; }
        public Guid PlanId { get; set; }
        public string Status { get; set; }
        public DateTimeOffset? CurrentPeriodEnd { get; set; }
        public bool CancelAtPeriodEnd { get; set; }
        public DateTimeOffset CreatedAt { get; set; }
        public DateTimeOffset UpdatedAt { get; set; }
    }
}
