using System.Text;
using System.Text.Json;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.IdentityModel.Tokens;
using SchoolCore.API.Middleware;
using SchoolCore.Business;
using SchoolCore.Common.Converters;
using SchoolCore.Common.Options;
using Serilog;

// Bootstrap one-off: generate ASP.NET Identity password hash for 999_BootstrapTenant_AppFabric.sql
if (args.Any(a => string.Equals(a, "--hash-password", StringComparison.OrdinalIgnoreCase)))
{
    var password = GetArgValue(args, "--hash-password");
    if (string.IsNullOrWhiteSpace(password))
    {
        Console.Error.WriteLine("Usage: dotnet run --project SchoolCore.API -- --hash-password \"YourPassword123\"");
        return 1;
    }

    var hasher = new Microsoft.AspNetCore.Identity.PasswordHasher<object>();
    var hash = hasher.HashPassword(new object(), password);
    Console.WriteLine(hash);
    Console.WriteLine();
    Console.WriteLine("Paste the hash into @PasswordHash in database/Scripts/999_BootstrapTenant_AppFabric.sql");
    return 0;
}

Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);

    builder.Host.UseSerilog((context, services, configuration) =>
    {
        var minLevel = context.Configuration["Logging:MinLevel"] ?? "Error";
        var sink = context.Configuration["Logging:Sink"] ?? "File";

        configuration
            .ReadFrom.Configuration(context.Configuration)
            .ReadFrom.Services(services)
            .Enrich.FromLogContext()
            .MinimumLevel.Is(ParseLevel(minLevel))
            // Arranque Kestrel / URLs visibles aunque MinLevel sea Error/Warning
            .MinimumLevel.Override("Microsoft.Hosting.Lifetime", Serilog.Events.LogEventLevel.Information)
            .MinimumLevel.Override("SchoolCore", Serilog.Events.LogEventLevel.Information);

        if (string.Equals(sink, "File", StringComparison.OrdinalIgnoreCase))
        {
            configuration.WriteTo.File(
                path: "logs/schoolcore-.log",
                rollingInterval: RollingInterval.Day,
                retainedFileCountLimit: 30);
        }

        configuration.WriteTo.Console();
    });

    builder.Services.AddSchoolCoreBusiness(builder.Configuration);

    var jwtSection = builder.Configuration.GetSection(JwtOptions.SectionName);
    var jwtOptions = jwtSection.Get<JwtOptions>() ?? new JwtOptions();

    builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
        .AddJwtBearer(options =>
        {
            options.TokenValidationParameters = new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateIssuerSigningKey = true,
                ValidateLifetime = true,
                ClockSkew = TimeSpan.FromMinutes(1),
                ValidIssuer = jwtOptions.Issuer,
                ValidAudience = jwtOptions.Audience,
                IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.Secret))
            };
        });

    builder.Services.AddAuthorization();

    builder.Services.AddControllers()
        .AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
            options.JsonSerializerOptions.Converters.Add(new MexicoDateTimeConverter());
            options.JsonSerializerOptions.Converters.Add(new MexicoNullableDateTimeConverter());
        });

    builder.Services.AddResponseCompression(options =>
    {
        options.EnableForHttps = true;
        options.Providers.Add<BrotliCompressionProvider>();
        options.Providers.Add<GzipCompressionProvider>();
    });

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("SchoolCoreCors", policy =>
        {
            var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                ?? ["http://localhost:5173"];
            policy.WithOrigins(origins)
                .AllowAnyHeader()
                .AllowAnyMethod();
        });
    });

    builder.Services.AddRateLimiter(options =>
    {
        options.RejectionStatusCode = StatusCodes.Status429TooManyRequests;

        options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 150,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }));

        options.AddPolicy("AuthLogin", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 20,
                    Window = TimeSpan.FromMinutes(1),
                    QueueLimit = 0
                }));

        options.AddPolicy("ForgotPassword", httpContext =>
            RateLimitPartition.GetFixedWindowLimiter(
                partitionKey: httpContext.Connection.RemoteIpAddress?.ToString() ?? "unknown",
                factory: _ => new FixedWindowRateLimiterOptions
                {
                    PermitLimit = 5,
                    Window = TimeSpan.FromMinutes(15),
                    QueueLimit = 0
                }));
    });

    if (builder.Environment.IsDevelopment())
    {
        builder.Services.AddOpenApi();
    }

    builder.Services.AddHealthChecks();

    var app = builder.Build();

    app.UseMiddleware<GlobalExceptionHandlerMiddleware>();
    app.UseSerilogRequestLogging();
    app.UseResponseCompression();
    app.UseCors("SchoolCoreCors");
    app.UseRateLimiter();

    if (app.Environment.IsDevelopment())
    {
        app.MapOpenApi();
    }

    // Forzar SSL solo en Production (QA/Dev actuales sin certificado)
    if (app.Environment.IsProduction())
    {
        app.UseHttpsRedirection();
    }

    app.UseAuthentication();
    app.UseMiddleware<TenantContextMiddleware>();
    app.UseAuthorization();
    app.MapControllers();
    app.MapHealthChecks("/healthz");

    // Banner a consola (no depende del MinLevel de Serilog)
    Console.WriteLine();
    Console.WriteLine("SchoolCore API starting");
    Console.WriteLine($"  Environment: {app.Environment.EnvironmentName}");
    Console.WriteLine($"  Tip: prefer `dotnet run --launch-profile https` (aplica launchSettings URLs).");
    Console.WriteLine($"  Health: /healthz");
    Console.WriteLine();

    Log.Information("SchoolCore API starting ({Environment})", app.Environment.EnvironmentName);
    app.Run();
    return 0;
}
catch (Exception ex)
{
    Log.Fatal(ex, "SchoolCore API terminated unexpectedly");
    return 1;
}
finally
{
    Log.CloseAndFlush();
}

static Serilog.Events.LogEventLevel ParseLevel(string level) =>
    Enum.TryParse<Serilog.Events.LogEventLevel>(level, true, out var parsed)
        ? parsed
        : Serilog.Events.LogEventLevel.Error;

static string? GetArgValue(string[] args, string name)
{
    for (var i = 0; i < args.Length; i++)
    {
        if (!string.Equals(args[i], name, StringComparison.OrdinalIgnoreCase))
        {
            continue;
        }

        if (i + 1 < args.Length && !args[i + 1].StartsWith('-'))
        {
            return args[i + 1];
        }

        var inline = args[i].Split('=', 2);
        if (inline.Length == 2)
        {
            return inline[1];
        }
    }

    return null;
}
