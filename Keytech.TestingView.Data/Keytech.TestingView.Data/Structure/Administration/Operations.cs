using Keytech.Framework.Core.Extensions;
using Microsoft.Data.SqlClient;
using System.Data;
using System.Threading.Tasks;
using System.Threading;
using Keytech.Framework.Data.Extensions;
using System.Collections.Generic;
using System;
using System.Linq;
using Keytech.Framework.JSON.Extensions;

namespace Keytech.TestingView.Data
{
    public partial class TestingViewContext
    {
        public partial class AdministrationSchema
        {
            public Task<Guid?> GetUserId(Data.Administration.User user, CancellationToken cancellationToken)
            {
                return _db.CallFunction<Guid?>("[Administration].[GetUserId]", cancellationToken,
                    new SqlParameter("@UserJson", SqlDbType.NVarChar, -1).SetValue(user.ToJson()));
            }

            public ValueTask<Data.Administration.User> GetUserById(Guid userId, CancellationToken cancellationToken)
            {
                IAsyncEnumerable<object[]> rows = _db.Query("[Administration].GetUserById", cancellationToken,
                [
                    new SqlParameter("@UserId", SqlDbType.UniqueIdentifier).SetValue(userId)
                ]);

                return rows.Select((object[] row) => new Administration.User
                {
                    UserId = row[0].As<Guid>(),
                    Email = row[1].As<string>(),
                    TradingViewUsername = row[2].As<string>(),
                    Plan = new Data.Administration.Plan
                    {
                        PlanId = row[3].As<Guid>(),
                        Name = row[4].As<string>(),
                    },
                    PlanExpiration = row[5].As<DateTimeOffset>(),
                    Language = new UI.Language { LanguageCode = row[6].As<string>() },
                    CreationDate = row[7].As<DateTimeOffset>(),
                }).SingleOrDefaultAsync();
            }

            public ValueTask<Guid> SaveUser(Data.Administration.User user)
            {
                return _db.CallArrayFunction<Guid>("[Administration].SaveUser", CancellationToken.None,
                    [
                    new SqlParameter("@UserJson", SqlDbType.NVarChar, -1).SetValue(user.ToJson())
                    ]).SingleAsync();
            }

            public IAsyncEnumerable<string> GetPermissions(Guid planId, CancellationToken cancellationToken)
            {
                return _db.CallArrayFunction<string>("[Administration].GetPermissions", cancellationToken,
                    [
                        new SqlParameter("@PlanId", SqlDbType.UniqueIdentifier).SetValue(planId)
                    ]);
            }
        }
    }
}