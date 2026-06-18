using System.Text;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using JobTracker.Infrastructure.Repositories;
using JobTracker.Infrastructure.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;

namespace JobTracker.Infrastructure;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services,IConfiguration configuration)
    {
        services.AddDbContext<JobTrackerDbContext>(options =>
            options.UseSqlServer(
                configuration.GetConnectionString("Default"),
                sql => sql.EnableRetryOnFailure(
                    maxRetryCount: 5,
                    maxRetryDelay: TimeSpan.FromSeconds(10),
                    errorNumbersToAdd: null)));

        services.AddScoped<IJobRepository, JobRepository>();
        services.AddScoped<IJobStatusHistoryRepository, JobStatusHistoryRepository>();
        services.AddScoped<ICalendarEventRepository, CalendarEventRepository>();
        services.AddScoped<IPlannerTaskRepository, PlannerTaskRepository>();
        services.AddScoped<IUserDocumentRepository, UserDocumentRepository>();
        services.AddScoped<IEventTypeRepository, EventTypeRepository>();
        services.AddScoped<IJobStatusConfigRepository, JobStatusConfigRepository>();
        services.AddScoped<IPracticeQuestionRepository, PracticeQuestionRepository>();
        services.AddScoped<IPracticeCategoryRepository, PracticeCategoryRepository>();
        services.AddScoped<IPracticeAttemptRepository, PracticeAttemptRepository>();
        services.AddScoped<IAppUserRepository, AppUserRepository>();
        services.AddScoped<IJwtService, JwtService>();
        services.AddScoped<IDemoResetService, DemoResetService>();
        services.AddScoped<IGoogleAuthService, GoogleAuthService>();
        services.AddScoped<IFacebookAuthService, FacebookAuthService>();
        services.AddHttpClient();
        services.AddSingleton<IBlobStorageService, BlobStorageService>();
        services.AddSingleton<IAzureOpenAiService, AzureOpenAiService>();

        services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    ValidIssuer = configuration["Jwt:Issuer"],
                    ValidAudience = configuration["Jwt:Audience"],
                    IssuerSigningKey = new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes(configuration["Jwt:Key"]!))
                };
            });

        return services;
    }
}
