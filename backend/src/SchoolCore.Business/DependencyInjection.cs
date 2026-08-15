using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SchoolCore.Business.Email;
using SchoolCore.Business.Services;
using SchoolCore.Common.Options;
using SchoolCore.Common.Security;
using SchoolCore.Common.Time;
using SchoolCore.DataAccess;

namespace SchoolCore.Business;

/// <summary>
/// Registro DI de Business (+ DataAccess).
/// </summary>
public static class BusinessServiceCollectionExtensions
{
    public static IServiceCollection AddSchoolCoreBusiness(this IServiceCollection services, IConfiguration configuration)
    {
        services.Configure<JwtOptions>(configuration.GetSection(JwtOptions.SectionName));
        services.Configure<SmtpOptions>(configuration.GetSection(SmtpOptions.SectionName));
        services.Configure<AppOptions>(configuration.GetSection(AppOptions.SectionName));
        services.Configure<DocumentsOptions>(configuration.GetSection(DocumentsOptions.SectionName));

        services.AddSchoolCoreDataAccess();
        services.AddMemoryCache();
        services.AddSingleton<ITimeZoneService, TimeZoneService>();
        services.AddSingleton<IEmailQueue, ChannelEmailQueue>();
        services.AddHostedService<EmailDispatchWorker>();
        services.AddScoped<ITenantContext, TenantContext>();
        services.AddScoped<IHealthService, HealthService>();
        services.AddScoped<IJwtTokenService, JwtTokenService>();
        services.AddScoped<IEmailSender, SmtpEmailSender>();
        services.AddScoped<IPermissionResolver, PermissionResolver>();
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IOrganizationService, OrganizationService>();
        services.AddScoped<IPeopleService, PeopleService>();
        services.AddScoped<IAcademicService, AcademicService>();
        services.AddScoped<IFinanceService, FinanceService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<INotificationService, NotificationService>();
        return services;
    }
}
