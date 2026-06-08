using JobTracker.Application.Interfaces;
using JobTracker.Infrastructure.Data;

namespace JobTracker.Infrastructure.Services;

public sealed class DemoResetService(JobTrackerDbContext ctx) : IDemoResetService
{
    public async Task ResetIfDemoAccountAsync(int userId, string email)
    {
        if (!string.Equals(email, DbSeeder.DemoEmail, StringComparison.OrdinalIgnoreCase)) return;
        await DbSeeder.ResetUserDataAsync(ctx, userId);
    }
}
