using Microsoft.Net.Http.Headers;
using System.Threading.RateLimiting;
using webapi.AuthHelpers;
using webapi.Authorization;
using webapi.Services;
using webapi.Data.Examples;

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

// Initialize database tables with sample data
InitializeDatabaseTables(app.Services);

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

void InitializeDatabaseTables(IServiceProvider services)
{
    try
    {
        using var scope = services.CreateScope();
        var config = scope.ServiceProvider.GetRequiredService<IConfiguration>();
        
        Console.WriteLine("🔄 Starting database initialization...");
        
        // Verify database files exist
        var currentDir = Environment.CurrentDirectory;
        Console.WriteLine($"📁 Current directory: {currentDir}");
        var algespaceDbPath = Path.Combine(currentDir, "Data", "databases", "algespace.db");
        var studiesDbPath = Path.Combine(currentDir, "Data", "databases", "studies.db");
        Console.WriteLine($"📊 Checking for algespace.db at: {algespaceDbPath}");
        Console.WriteLine($"📊 algespace.db exists: {File.Exists(algespaceDbPath)}");
        Console.WriteLine($"📊 Checking for studies.db at: {studiesDbPath}");
        Console.WriteLine($"📊 studies.db exists: {File.Exists(studiesDbPath)}");
        
        // Create Goals and PretestAnswers tables in studies.db
        CreateStudiesDBTables(config);
        
        // Initialize Flexibility Exercise Service tables
        var flexService = scope.ServiceProvider.GetRequiredService<IFlexibilityExerciseService>();
        InitializeTable("Suitability", () => flexService.SetSuitabilityExercises(SuitabilityExamples.GetExamples()));
        InitializeTable("Efficiency", () => flexService.SetEfficiencyExercises(EfficiencyExamples.GetExamples()));
        InitializeTable("Matching", () => flexService.SetMatchingExercises(MatchingExamples.GetExamples()));
        InitializeTable("TipExercises", () => flexService.SetTipExercises(TipExercisesExamples.GetExamples()));
        InitializeTable("PlainExercises", () => flexService.SetPlainExercises(PlainExerciseExamples.GetExamples()));
        InitializeTable("FlexibilityExercises", () => flexService.SetFlexibilityExercises(FlexibilityExamples.GetFlexibilityExercises()));
        
        // Initialize CK Exercise Service tables
        var ckService = scope.ServiceProvider.GetRequiredService<ICKExerciseService>();
        InitializeTable("Equalization", () => ckService.SetEqualizationExercises(EqualizationExamples.GetExamples()));
        InitializeTable("Bartering", () => ckService.SetBarteringExercises(BarteringExamples.GetExamples()));
        InitializeTable("Substitution", () => ckService.SetSubstitutionExercises(SubstitutionExamples.GetExamples()));
        InitializeTable("Elimination", () => ckService.SetEliminationExercises(EliminationExamples.GetExamples()));
        
        Console.WriteLine("✅ Database initialization completed successfully!");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error initializing database tables: {ex.Message}");
        Console.WriteLine($"Stack trace: {ex.StackTrace}");
    }
}

void CreateStudiesDBTables(IConfiguration config)
{
    try
    {
        var connectionString = config.GetConnectionString("DefaultConnection");
        if (string.IsNullOrEmpty(connectionString)) return;

        using var conn = new System.Data.SQLite.SQLiteConnection(connectionString);
        conn.Open();

        // Create Goals table
        var createGoalsTable = @"
            CREATE TABLE IF NOT EXISTS Goals (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER NOT NULL,
                Title TEXT NOT NULL,
                Difficulty TEXT NOT NULL,
                CreatedAt TEXT NOT NULL,
                UpdatedAt TEXT,
                Completed INTEGER NOT NULL DEFAULT 0,
                MotivationRating INTEGER,
                Category TEXT NOT NULL,
                ConfidenceBefore INTEGER,
                ExpectedMistakes INTEGER,
                ActualScore REAL,
                GoalAchieved INTEGER,
                HintsUsed INTEGER,
                ErrorsMade INTEGER,
                PostSatisfaction INTEGER,
                PostConfidence INTEGER,
                PostEffort INTEGER,
                PostEnjoyment INTEGER,
                PostAnxiety INTEGER
            );";

        using var cmd1 = new System.Data.SQLite.SQLiteCommand(createGoalsTable, conn);
        cmd1.ExecuteNonQuery();
        Console.WriteLine("✅ Goals table created/verified");

        // Create PretestAnswers table
        var createPretestTable = @"
            CREATE TABLE IF NOT EXISTS PretestAnswers (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER NOT NULL,
                Answers TEXT NOT NULL,
                SuggestedGoals TEXT NOT NULL,
                CompletedAt TEXT NOT NULL
            );";

        using var cmd2 = new System.Data.SQLite.SQLiteCommand(createPretestTable, conn);
        cmd2.ExecuteNonQuery();
        Console.WriteLine("✅ PretestAnswers table created/verified");

        // Create CustomExercises table
        var createCustomExercisesTable = @"
            CREATE TABLE IF NOT EXISTS CustomExercises (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER NOT NULL,
                GoalId INTEGER NOT NULL,
                ExerciseType TEXT NOT NULL,
                CompletedAt TEXT NOT NULL,
                Score REAL,
                TimeSpent INTEGER,
                HintsUsed INTEGER,
                ErrorsMade INTEGER
            );";

        using var cmd3 = new System.Data.SQLite.SQLiteCommand(createCustomExercisesTable, conn);
        cmd3.ExecuteNonQuery();
        Console.WriteLine("✅ CustomExercises table created/verified");

        // Create Logs table
        var createLogsTable = @"
            CREATE TABLE IF NOT EXISTS Logs (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                UserId INTEGER NOT NULL,
                ActionType TEXT NOT NULL,
                Timestamp TEXT NOT NULL,
                Description TEXT
            );";

        using var cmd4 = new System.Data.SQLite.SQLiteCommand(createLogsTable, conn);
        cmd4.ExecuteNonQuery();
        Console.WriteLine("✅ Logs table created/verified");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Error creating studies.db tables: {ex.Message}");
    }
}

void InitializeTable(string tableName, Action initAction)
{
    try
    {
        Console.WriteLine($"🔄 Initializing {tableName}...");
        initAction();
        Console.WriteLine($"✅ {tableName} table initialized");
        
        // Verify data was actually inserted
        VerifyTableHasData(tableName);
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ Failed to initialize {tableName}: {ex.Message}");
        Console.WriteLine($"   Stack trace: {ex.StackTrace}");
        // Don't throw - continue with other tables
    }
}

void VerifyTableHasData(string tableName)
{
    try
    {
        using var conn = new System.Data.SQLite.SQLiteConnection("Data Source=" + Environment.CurrentDirectory + "/Data/databases/algespace.db");
        conn.Open();
        var cmd = new System.Data.SQLite.SQLiteCommand($"SELECT COUNT(*) FROM {tableName}", conn);
        var count = Convert.ToInt32(cmd.ExecuteScalar());
        Console.WriteLine($"   📊 {tableName} has {count} rows");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"   ⚠️ Could not verify {tableName} data: {ex.Message}");
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
    // app.UseMiddleware<ApiKeyMiddleware>(); // DISABLED for public access - re-enable if API key protection needed
    app.UseHttpsRedirection();
}

app.UseMiddleware<JwtMiddleware>(); // Middlewares are only required for conducting studies
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
