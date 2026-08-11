using Keytech.TestingView.API.Processing;
using Keytech.Framework.Core.Helpers;
using Keytech.Framework.JSON.Extensions;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json.Linq;

namespace Keytech.TestingView.API.Controllers
{
    [ApiController]
    [Route("admin")]
    public class TestingViewAdminController : ControllerBase
    {
        [HttpPut("user")]
        public Task<Guid> GetOrSaveUser(JObject tradingViewUser, CancellationToken cancellationToken)
        {
            return App.TestingViewAdminDataService.GetOrSaveUserId(tradingViewUser, cancellationToken);
        }

        [HttpGet("user/{userId}")]
        public ValueTask<Data.Administration.User> GetUserById(Guid userId, CancellationToken cancellationToken)
        {
            return App.TestingViewAdminDataService.GetUserById(userId, cancellationToken);
        }

        [HttpGet("plans/{planId}/permissions")]
        public IAsyncEnumerable<string> GetPermissions(Guid planId, CancellationToken cancellationToken)
        {
            return App.TestingViewAdminDataService.GetPermissions(planId, cancellationToken);
        }

        [HttpPost("user")]
        public async Task<Guid> UpdateUser()
        {
            using var reader = new StreamReader(Request.Body);
            string body = await reader.ReadToEndAsync();
            App.Log($"Updating user:\n\n{body}", LogLevel.Trace);

            JObject json = JObject.Parse(body);

            string email = JsonInfoParsing.GetEmailFromJsonInfo(json);
            string tradingViewUsername = JsonInfoParsing.GetTradingViewUsernameFromJsonInfo(json);
            DateTimeOffset? planExpiration = JsonInfoParsing.GetEpirationDateFromJsonInfo(json);

            return await App.TestingViewAdminDataService.UpdateUserByEmail(email, tradingViewUsername, planExpiration: planExpiration);
        }

        [HttpPost("plan")]
        public async Task<Data.Administration.User> CreateNewUserPlan()
        {
            using var reader = new StreamReader(Request.Body);
            string body = await reader.ReadToEndAsync();
            App.Log($"Creating new user plan:\n\n{body}", LogLevel.Trace);

            JObject json = JObject.Parse(body);

            Guid buyerId = JsonInfoParsing.GetBuyerId(json);
            string email = JsonInfoParsing.GetEmailFromJsonInfo(json);
            string tradingViewUsername = JsonInfoParsing.GetTradingViewUsernameFromJsonInfo(json);
            Guid planId = JsonInfoParsing.GetPlanId(json);
            DateTimeOffset? planExpiration = JsonInfoParsing.GetEpirationDateFromJsonInfo(json);

            var user = new Data.Administration.User
            {
                UserId = buyerId,
                Email = email,
                TradingViewUsername = tradingViewUsername,
                Plan = new Data.Administration.Plan
                {
                    PlanId = planId,
                },
                PlanExpiration = planExpiration.HasValue ? planExpiration.Value : DateTimeOffset.Now.AddYears(30),
                Language = new Data.UI.Language { LanguageCode = "en" },
            };

            await App.TestingViewAdminDataService.SaveUser(user);
            return user;
        }

        [HttpPost("plan-cancellation")]
        public async Task<Guid> PlanCancellation()
        {
            using var reader = new StreamReader(Request.Body);
            string body = await reader.ReadToEndAsync();
            App.Log($"Cancelling plan:\n\n{body}", LogLevel.Trace);

            JObject json = JObject.Parse(body);

            string email = JsonInfoParsing.GetEmailFromJsonInfo(json);
            string tradingViewUsername = JsonInfoParsing.GetTradingViewUsernameFromJsonInfo(json);
            DateTimeOffset? planExpiration = JsonInfoParsing.GetEpirationDateFromJsonInfo(json);

            return await App.TestingViewAdminDataService.UpdateUserByEmail(email, tradingViewUsername, planExpiration: planExpiration);
        }
    }
}