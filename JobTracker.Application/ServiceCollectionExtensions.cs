using JobTracker.Application.Interfaces;
using JobTracker.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace JobTracker.Application;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IJobService, JobService>();
        services.AddScoped<ICalendarEventService, CalendarEventService>();
        services.AddScoped<IPlannerTaskService, PlannerTaskService>();
        services.AddScoped<IUserDocumentService, UserDocumentService>();
        services.AddScoped<IEventTypeService, EventTypeService>();
        services.AddScoped<IStatsService, StatsService>();
        services.AddScoped<IJobStatusConfigService, JobStatusConfigService>();
        services.AddScoped<IUserProfileService, UserProfileService>();
        services.AddScoped<IAuthService, AuthService>();
        return services;
    }
}
