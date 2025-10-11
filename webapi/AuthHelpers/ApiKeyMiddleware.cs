using System.Net;

namespace webapi.Authorization
{
    public static class Settings
    {
        public const string ApiKeyHeaderName = "X-API-Key";
        public const string ApiKeyName = "ApiKey";
    }

    public class ApiKeyMiddleware
    {
        private readonly RequestDelegate _next;

        public ApiKeyMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Temporarily disabled for public access - allow all requests
            await _next(context);
            return;
            
            /* Original API key check - commented out for public access
            if (string.IsNullOrWhiteSpace(context.Request.Headers[Settings.ApiKeyHeaderName]))
            {
                context.Response.StatusCode = (int)HttpStatusCode.BadRequest;
                return;
            }

            string? userApiKey = context.Request.Headers[Settings.ApiKeyHeaderName];

            if (!IsValidApiKey(context, userApiKey!))
            {
                context.Response.StatusCode = (int)HttpStatusCode.Unauthorized;
                return;
            }

            await _next(context);
            */
        }

        public bool IsValidApiKey(HttpContext context, string userApiKey)
        {
            if (string.IsNullOrWhiteSpace(userApiKey))
            {
                return false;
            }

            var authSettings = context.RequestServices.GetRequiredService<IConfiguration>();
            string? apiKey = authSettings.GetValue<string>(Settings.ApiKeyName);

            return !(apiKey == null || apiKey != userApiKey);
        }
    }
}
