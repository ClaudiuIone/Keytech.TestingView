using Keytech.Framework.Core.Extensions;
using Microsoft.AspNetCore.Http;

namespace Keytech.TestingView.API.Processing
{
    public class ApiExceptionLoggingMiddleware
    {
        private readonly RequestDelegate _next;

        public ApiExceptionLoggingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception e)
            {
                App.Log($"[API Error] {context.Request.Method} {context.Request.Path}{context.Request.QueryString}: {e.GetDetails()}", LogLevel.Error);
                throw;
            }
        }
    }
}
