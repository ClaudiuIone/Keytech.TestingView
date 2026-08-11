using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Keytech.Framework.Core.Extensions;
using Keytech.Framework.JSON.Extensions;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;

namespace Keytech.TestingView.Data.Services
{
    public class TestingViewAdminDataService : TestingViewDataService
    {
        protected TestingViewAdminDataService(TestingViewContext TestingViewDb) : base(TestingViewDb)
        {
        }

        public async static Task<TestingViewAdminDataService> CreateService(string TestingViewConnectionString)
        {
            TestingViewContext TestingViewDb = await TestingViewContext.CreateDb(TestingViewConnectionString);
            return new TestingViewAdminDataService(TestingViewDb);
        }

        public Task<Guid?> GetUserId(Data.Administration.User user, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Administration.GetUserId(user, cancellationToken);
        }

        public ValueTask<Data.Administration.User> GetUserById(Guid userId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Administration.GetUserById(userId, cancellationToken);
        }

        public ValueTask<Guid> SaveUser(Data.Administration.User user)
        {
            return _TestingViewDb.Administration.SaveUser(user);
        }

        public async Task<Guid> GetOrSaveUserId(JObject tradingViewUser, CancellationToken cancellationToken)
        {
            Guid? userId = await this.GetUserId(new Data.Administration.User { TradingViewUsername = tradingViewUser.Get("username") }, cancellationToken);
            if (userId.HasValue)
            {
                this.SaveUser(new Data.Administration.User
                {
                    UserId = userId.Value,
                    TradingViewUserJson = tradingViewUser.ToString(),
                });

                return userId.Value;
            }
            else
            {
                return await this.SaveUser(new Data.Administration.User
                {
                    UserId = Guid.NewGuid(),
                    TradingViewUsername = tradingViewUser.Get("username"),
                    Plan = new Data.Administration.Plan
                    {
                        PlanId = Data.Administration.Plan.Trader,
                    },
                    PlanExpiration = DateTimeOffset.Now.AddDays(30),
                    Language = new Data.UI.Language { LanguageCode = "en" },
                    TradingViewUserJson = tradingViewUser.ToString(),
                });
            }
        }

        public async Task<Guid> UpdateUserByEmail(string email, string tradingViewUsername = default, Guid? planId = default, DateTimeOffset? planExpiration = default)
        {
            this.Log($"Updating user with email {email} or TV username {tradingViewUsername}", LogLevel.Trace);

            Guid? userId = await this.GetUserId(new Data.Administration.User { Email = email, TradingViewUsername = tradingViewUsername }, CancellationToken.None);
            if (!userId.HasValue)
            {
                this.Log($"Unable to find user with email {email} or TV username {tradingViewUsername}", LogLevel.Error);
                throw new KeyNotFoundException("User not found");
            }
            else
            {
                Data.Administration.User user = await this.GetUserById(userId.Value, CancellationToken.None);
                if (tradingViewUsername.HasValue())
                {
                    user.TradingViewUsername = tradingViewUsername;
                }

                if (email.HasValue())
                {
                    user.Email = email;
                }

                if (planId.HasValue)
                {
                    user.Plan = new Data.Administration.Plan
                    {
                        PlanId = planId.Value,
                    };
                }

                if (planExpiration.HasValue)
                {
                    user.PlanExpiration = planExpiration.Value;
                }

                return await this.SaveUser(user);
            }
        }

        public IAsyncEnumerable<string> GetPermissions(Guid planId, CancellationToken cancellationToken)
        {
            return _TestingViewDb.Administration.GetPermissions(planId, cancellationToken);
        }

        protected override void Log(string info, LogLevel logLevel = LogLevel.Trace)
        {
            base.Log($"[{nameof(TestingViewAdminDataService)}] {info}", logLevel);
        }
    }
}
