using Newtonsoft.Json.Linq;
using System.Globalization;
using Keytech.Framework.JSON.Extensions;

namespace Keytech.TestingView.API.Processing
{
    internal class JsonInfoParsing
    {
        public static string GetEmailFromJsonInfo(JObject json)
        {
            return json.SelectToken("entity.primaryInfo").Get("email")
                ?? json.SelectToken("entity.primaryEmail").Get("email")
                ?? json.SelectToken("entity.info.extendedFields").Get("emailSubscriptions.effectiveEmail")
                ?? json.SelectToken("entity.info.emails")?[0].Get("email")
                ?? json.SelectToken("contact.primaryInfo").Get("email")
                ?? json.SelectToken("contact.primaryEmail").Get("email")
                ?? json.SelectToken("contact.info.extendedFields").Get("emailSubscriptions.effectiveEmail")
                ?? json.SelectToken("contact.info.emails")?[0].Get("email")
                ?? json.SelectToken("data.contact").Get("email")
                ?? json.SelectToken("contact.memberInfo").Get("email")
                ?? json.SelectToken("entity.memberInfo").Get("email")
                ?? json.SelectToken("data.contact.emails")?[0].Get("email");
        }

        public static DateTimeOffset? GetEpirationDateFromJsonInfo(JObject json)
        {
            string rawPlanExpiration = json.SelectToken("data").Get("plan_valid_until")
                ?? json.SelectToken("data.order").Get("endDate")
                ?? json.SelectToken("data.order.currentCycle").Get("endedDate");

            return DateTimeOffset.TryParseExact(rawPlanExpiration, [
                "M/d/yyyy", 
                "MM/dd/yyyy", 
                "M/d/yy",
                "MM/dd/yy",
                "M/d/yyyy HH:mm:ss",
                "MM/dd/yyyy HH:mm:ss",
                "M/d/yy HH:mm:ss",
                "MM/dd/yy HH:mm:ss",
                "yyyy-MM-dd'T'HH:mm:ssK",
                "yyyy-MM-dd'T'HH:mm:ss.FFFFFFFK"],
                CultureInfo.GetCultureInfo("en-US"), DateTimeStyles.AssumeUniversal | DateTimeStyles.AdjustToUniversal, out DateTimeOffset planExpiration)
                ? planExpiration
                : null;
        }

        public static string GetTradingViewUsernameFromJsonInfo(JObject json)
        {
            return json.SelectToken("entity.info.extendedFields").Get("custom.tradingview-username")
                ?? json.SelectToken("contact.info.extendedFields").Get("custom.tradingview-username")
                ?? json.SelectToken("submission.submissions").Get("trading_view_username")
                ?? json.SelectToken("member.profile").Get("nickname")
                ?? json.SelectToken("contact.memberInfo.profileInfo").Get("nickname");
        }

        public static Guid GetBuyerId(JObject json)
        {
            string rawBuyerId = json.SelectToken("data.order.buyer").Get("contactId")
                ?? json.SelectToken("entity").Get("_id")
                ?? json.SelectToken("contact").Get("_id")
                ?? json.SelectToken("member").Get("_id")
                ?? json.SelectToken("member").Get("contactId")
                ?? json.SelectToken("contact.memberInfo").Get("memberId");

            return Guid.TryParse(rawBuyerId, out var id) ? id : Guid.NewGuid();
        }


        public static Guid GetPlanId(JObject json)
        {
            if(!Guid.TryParse(json.SelectToken("data.order").Get("planId"), out Guid planId))
            {
                JToken[] labelKeys = json.SelectToken("..labelKeys").ToArray();

                if(labelKeys.Contains("pricingPlans.starter"))
                {
                    planId = Data.Administration.Plan.Starter;
                }
                if (labelKeys.Contains("pricingPlans.explorer"))
                {
                    planId = Data.Administration.Plan.Explorer;
                }
                if (labelKeys.Contains("pricingPlans.trader"))
                {
                    planId = Data.Administration.Plan.Trader;
                }
            }

            return planId;
        }
    }
}