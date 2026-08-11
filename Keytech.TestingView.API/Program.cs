
using Keytech.Framework.Core.Extensions;
using Keytech.Framework.Net.Filters;
using Newtonsoft.Json.Serialization;
using System.Security.Cryptography.X509Certificates;
using Keytech.TestingView.API.Processing;

namespace Keytech.TestingView.API
{
    public class Program
    {
        public static int Version { get; internal set; }

        public static async Task Main(string[] args)
        {
            var builder = WebApplication.CreateBuilder(args);

            builder.Services.AddCors();
            builder.Services
                .AddControllers(o =>
                {
                    o.Filters.Add<OperationCancelledExceptionFilter>();
                    o.Filters.Add<UnauthorisedExceptionFilter>();
                })
                .AddNewtonsoftJson(o =>
                {
                    o.SerializerSettings.ContractResolver = new CamelCasePropertyNamesContractResolver();
                    o.SerializerSettings.NullValueHandling = Newtonsoft.Json.NullValueHandling.Ignore;
                })
                ;
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen();

            var certificate = new X509Certificate2(@"cert\certificate.pfx", "");

            builder.WebHost
                .UseKestrel(options =>
                {
                    options.ListenAnyIP(443, listenOptions =>
                    {
                        listenOptions.UseHttps(certificate);
                    });
                });

            builder.WebHost.UseIISIntegration().UseIIS();

            var app = builder.Build();
            app.UseHttpsRedirection();
            app.UseRouting();
            app.UseMiddleware<ApiExceptionLoggingMiddleware>();
            app.UseAuthorization();
            app.MapControllers();
            app.UseSwagger();
            app.UseSwaggerUI();
            app.UseStaticFiles(); 
            app.UseCors(builder => builder
                            .AllowAnyOrigin()
                            .AllowAnyMethod()
                            .AllowAnyHeader()
                            .WithExposedHeaders("Content-Disposition", "X-Filename", "Content-Type", "Content-Length")
                        );
            app.Use(async (context, next) =>
            {
                context.Response.Headers.Append("Content-Security-Policy", "default-src * 'unsafe-inline' 'unsafe-eval'; connect-src *;");
                await next();
            });

            TestingViewApiSettings.Bind(builder.Configuration);
            await App.Initialize();
            try
            {
                app.Run();
            }
            catch (Exception e)
            {
                App.Log($"Unrecoverable error: {e.GetDetails()}", LogLevel.Error);
                await App.WaitForLogs();
            }
        }
    }
}
