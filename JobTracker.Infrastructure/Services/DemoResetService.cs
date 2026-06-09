using JobTracker.Application.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Services;

public sealed class DemoResetService(JobTrackerDbContext ctx, IBlobStorageService blob) : IDemoResetService
{
    public async Task ResetIfDemoAccountAsync(int userId, string email)
    {
        if (!string.Equals(email, DbSeeder.DemoEmail, StringComparison.OrdinalIgnoreCase)) return;

        var user = await ctx.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user?.AvatarBlobName is not null)
        {
            await blob.DeleteAsync(user.AvatarBlobName);
            user.AvatarBlobName = null;
            await ctx.SaveChangesAsync();
        }

        await DbSeeder.ResetUserDataAsync(ctx, userId);
    }
}
