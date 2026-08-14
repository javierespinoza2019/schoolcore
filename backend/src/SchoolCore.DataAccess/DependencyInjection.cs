using Microsoft.Extensions.DependencyInjection;
using SchoolCore.DataAccess.Repositories;

namespace SchoolCore.DataAccess;

/// <summary>
/// Registro DI de DataAccess.
/// </summary>
public static class DataAccessServiceCollectionExtensions
{
    public static IServiceCollection AddSchoolCoreDataAccess(this IServiceCollection services)
    {
        services.AddSingleton<ISqlConnectionFactory, SqlConnectionFactory>();
        services.AddScoped<IHealthRepository, HealthRepository>();
        services.AddScoped<IAuthRepository, AuthRepository>();
        services.AddScoped<IOrganizationRepository, OrganizationRepository>();
        services.AddScoped<IPeopleRepository, PeopleRepository>();
        services.AddScoped<IAcademicRepository, AcademicRepository>();
        services.AddScoped<IFinanceRepository, FinanceRepository>();
        services.AddScoped<IReportRepository, ReportRepository>();
        services.AddScoped<INotificationRepository, NotificationRepository>();
        return services;
    }
}
