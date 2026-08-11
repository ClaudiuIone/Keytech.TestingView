using Keytech.Framework.Core.Extensions;
using Keytech.Framework.Data.Extensions;
using Microsoft.Data.SqlClient;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class WebSchema
        {
            public ValueTask<Web.ExternalLogin> GetExternalLoginByProvider(string provider, string providerSubject, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Web].[GetExternalLoginByProvider]", cancellationToken,
                [
                    new SqlParameter("@Provider", SqlDbType.NVarChar, 64).SetValue(provider),
                    new SqlParameter("@ProviderSubject", SqlDbType.NVarChar, 256).SetValue(providerSubject),
                ]);

                return rows.Select(row => new Web.ExternalLogin
                {
                    ExternalLoginId = row[0].As<Guid>(),
                    UserId = row[1].As<Guid>(),
                    Provider = row[2].As<string>(),
                    ProviderSubject = row[3].As<string>(),
                    Email = row[4].As<string>(),
                    DisplayName = row[5].As<string>(),
                    PictureUrl = row[6].As<string>(),
                    CreatedAt = row[7].As<DateTimeOffset>(),
                    UpdatedAt = row[8].As<DateTimeOffset>(),
                }).SingleOrDefaultAsync();
            }

            public Task UpsertExternalLogin(Guid userId, string provider, string providerSubject, string email, string displayName, string pictureUrl, CancellationToken cancellationToken)
            {
                return _db.Exec("[Web].[UpsertExternalLogin]", cancellationToken,
                [
                    new SqlParameter("@UserId", SqlDbType.UniqueIdentifier).SetValue(userId),
                    new SqlParameter("@Provider", SqlDbType.NVarChar, 64).SetValue(provider),
                    new SqlParameter("@ProviderSubject", SqlDbType.NVarChar, 256).SetValue(providerSubject),
                    new SqlParameter("@Email", SqlDbType.NVarChar, 320).SetValue(email),
                    new SqlParameter("@DisplayName", SqlDbType.NVarChar, 256).SetValue(displayName),
                    new SqlParameter("@PictureUrl", SqlDbType.NVarChar, 2048).SetValue(pictureUrl),
                ]);
            }

            public Task UpsertStripeCustomer(string stripeCustomerId, Guid userId, string email, CancellationToken cancellationToken)
            {
                return _db.Exec("[Web].[UpsertStripeCustomer]", cancellationToken,
                [
                    new SqlParameter("@StripeCustomerId", SqlDbType.NVarChar, 128).SetValue(stripeCustomerId),
                    new SqlParameter("@UserId", SqlDbType.UniqueIdentifier).SetValue(userId),
                    new SqlParameter("@Email", SqlDbType.NVarChar, 320).SetValue(email),
                ]);
            }

            public ValueTask<Web.StripeCustomer> GetStripeCustomerByUserId(Guid userId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Web].[GetStripeCustomerByUserId]", cancellationToken,
                [
                    new SqlParameter("@UserId", SqlDbType.UniqueIdentifier).SetValue(userId),
                ]);

                return rows.Select(row => new Web.StripeCustomer
                {
                    StripeCustomerId = row[0].As<string>(),
                    UserId = row[1].As<Guid>(),
                    Email = row[2].As<string>(),
                    CreatedAt = row[3].As<DateTimeOffset>(),
                    UpdatedAt = row[4].As<DateTimeOffset>(),
                }).SingleOrDefaultAsync();
            }

            public Task UpsertStripeSubscription(Web.StripeSubscription subscription, CancellationToken cancellationToken)
            {
                return _db.Exec("[Web].[UpsertStripeSubscription]", cancellationToken,
                [
                    new SqlParameter("@StripeSubscriptionId", SqlDbType.NVarChar, 128).SetValue(subscription.StripeSubscriptionId),
                    new SqlParameter("@UserId", SqlDbType.UniqueIdentifier).SetValue(subscription.UserId),
                    new SqlParameter("@StripeCustomerId", SqlDbType.NVarChar, 128).SetValue(subscription.StripeCustomerId),
                    new SqlParameter("@PlanId", SqlDbType.UniqueIdentifier).SetValue(subscription.PlanId),
                    new SqlParameter("@Status", SqlDbType.NVarChar, 64).SetValue(subscription.Status),
                    new SqlParameter("@CurrentPeriodEnd", SqlDbType.DateTimeOffset).SetValue(subscription.CurrentPeriodEnd),
                    new SqlParameter("@CancelAtPeriodEnd", SqlDbType.Bit).SetValue(subscription.CancelAtPeriodEnd),
                ]);
            }

            public ValueTask<Web.StripeSubscription> GetActiveStripeSubscription(Guid userId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Web].[GetActiveStripeSubscription]", cancellationToken,
                [
                    new SqlParameter("@UserId", SqlDbType.UniqueIdentifier).SetValue(userId),
                ]);

                return rows.Select(row => new Web.StripeSubscription
                {
                    StripeSubscriptionId = row[0].As<string>(),
                    UserId = row[1].As<Guid>(),
                    StripeCustomerId = row[2].As<string>(),
                    PlanId = row[3].As<Guid>(),
                    Status = row[4].As<string>(),
                    CurrentPeriodEnd = row[5].As<DateTimeOffset?>(),
                    CancelAtPeriodEnd = row[6].As<bool>(),
                    CreatedAt = row[7].As<DateTimeOffset>(),
                    UpdatedAt = row[8].As<DateTimeOffset>(),
                }).SingleOrDefaultAsync();
            }

            public async Task<bool> TryRecordStripeEvent(string stripeEventId, string eventType, string payloadHash, CancellationToken cancellationToken)
            {
                var result = await _db.CallArrayFunction<bool>("[Web].[TryRecordStripeEvent]", cancellationToken,
                [
                    new SqlParameter("@StripeEventId", SqlDbType.NVarChar, 128).SetValue(stripeEventId),
                    new SqlParameter("@EventType", SqlDbType.NVarChar, 128).SetValue(eventType),
                    new SqlParameter("@PayloadHash", SqlDbType.NVarChar, 128).SetValue(payloadHash),
                ]).SingleOrDefaultAsync();
                return result;
            }

            public Task InsertAccountAuditEvent(Guid? userId, string eventType, string details, CancellationToken cancellationToken)
            {
                return _db.Exec("[Web].[InsertAccountAuditEvent]", cancellationToken,
                [
                    new SqlParameter("@UserId", SqlDbType.UniqueIdentifier).SetValue(userId),
                    new SqlParameter("@EventType", SqlDbType.NVarChar, 128).SetValue(eventType),
                    new SqlParameter("@Details", SqlDbType.NVarChar, -1).SetValue(details),
                ]);
            }
        }
    }
}
