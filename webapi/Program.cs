using Microsoft.Net.Http.Headers;
using System.Threading.RateLimiting;
using webapi.AuthHelpers;
using webapi.Authorization;
using webapi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("DevelopmentPolicy", builder =>
    {
        builder.WithMethods("GET", "PUT", "POST","DELETE","PATCH")
            .WithHeaders(HeaderNames.Accept, HeaderNames.ContentType, HeaderNames.Authorization, "X-API-Key")
            .AllowCredentials()
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                if (origin.ToLower().StartsWith("http://localhost:5173")) return true;
                return false;
            });
    });

    options.AddPolicy("ProductionPolicy", builder =>
    {
        builder.WithMethods("GET", "PUT", "POST", "DELETE", "PATCH")
            .WithHeaders(HeaderNames.Accept, HeaderNames.ContentType, HeaderNames.Authorization, "X-API-Key")
            .AllowCredentials()
            .SetIsOriginAllowed(origin =>
            {
                if (string.IsNullOrWhiteSpace(origin)) return false;
                
                // Allow Railway backend domain
                if (origin.ToLower().StartsWith("https://algespace-production.up.railway.app")) return true;
                
                // Allow Netlify frontend domain
                if (origin.ToLower().StartsWith("https://algespace1.netlify.app")) return true;
                
                // Allow your original domain
                if (origin.ToLower().StartsWith("https://algespace.sic.saarland")) return true;
                
                return false;
            });
    });
});

builder.Services.AddRateLimiter(options =>
{
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(httpContext =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: httpContext.User.Identity?.Name ?? httpContext.Request.Headers.Host.ToString(),
            factory: partition => new FixedWindowRateLimiterOptions
            {
                AutoReplenishment = true,
                PermitLimit = 1000,
                QueueLimit = 0,
                Window = TimeSpan.FromMinutes(1)
            }));
});

builder.Services.Configure<AuthSettings>(builder.Configuration.GetSection("AuthSettings"));

builder.Services.AddScoped<ICKExerciseService, CKExerciseService>();
builder.Services.AddScoped<IFlexibilityExerciseService, FlexibilityExerciseService>();
builder.Services.AddScoped<IUserService, UserService>(); // Service is only required for conducting studies
builder.Services.AddScoped<ICKStudyService, CKStudyService>();
builder.Services.AddScoped<IFlexibilityStudyService, FlexibilityStudyService>();
builder.Services.AddScoped<IGoalService>(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var connectionString = config.GetConnectionString("DefaultConnection");
    return new GoalService(connectionString);
});

builder.Services.AddScoped<ICustomExerciseService>(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var connectionString = config.GetConnectionString("DefaultConnection");
    return new CustomExerciseService(connectionString);
});

builder.Services.AddScoped<ILogService>(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    var connectionString = config.GetConnectionString("DefaultConnection");
    return new LogService(connectionString);
});

builder.Services.AddScoped<IPretestService>(provider =>
{
    var config = provider.GetRequiredService<IConfiguration>();
    return new PretestService(config);
});

var app = builder.Build();

// Copy database to volume on first run (for Railway deployment)
EnsureDatabaseInVolume(app.Configuration);

void EnsureDatabaseInVolume(IConfiguration config)
{
    try
    {
        var connectionString = config.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString)) return;

        // Extract database path from connection string
        var volumeDbPath = connectionString.Split(';')[0].Replace("Data Source=", "").Trim();
        var volumeDir = Path.GetDirectoryName(volumeDbPath);
        
        // Create volume directory if it doesn't exist
        if (!string.IsNullOrEmpty(volumeDir) && !Directory.Exists(volumeDir))
        {
            Directory.CreateDirectory(volumeDir);
            Console.WriteLine($"✅ Created volume directory: {volumeDir}");
        }

        // Check if database already exists in volume
        if (!File.Exists(volumeDbPath))
        {
            // Try to copy from repo location
            var repoDbPath = "Data/databases/studies.db";
            if (File.Exists(repoDbPath))
            {
                File.Copy(repoDbPath, volumeDbPath, overwrite: false);
                Console.WriteLine($"✅ Copied database from repo to volume: {volumeDbPath}");
            }
            else
            {
                Console.WriteLine($"⚠️ Database not found in repo at: {repoDbPath}");
                Console.WriteLine($"⚠️ Volume database will be created on first use: {volumeDbPath}");
            }
        }
        else
        {
            Console.WriteLine($"✅ Database already exists in volume: {volumeDbPath}");
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error setting up database: {ex.Message}");
    }
}


app.UseRateLimiter();

if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseSwagger();
    app.UseSwaggerUI();
    app.UseCors("DevelopmentPolicy");
}
else
{
    app.UseCors("ProductionPolicy");
    app.UseMiddleware<ApiKeyMiddleware>(); // Modified to allow all requests for public access
    app.UseHttpsRedirection();
}

app.UseMiddleware<JwtMiddleware>(); // Middlewares are only required for conducting studies
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
