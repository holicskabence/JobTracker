using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class JobStatusConfigRepository(JobTrackerDbContext ctx)
    : BaseRepository<JobStatusConfig>(ctx), IJobStatusConfigRepository
{
    public async Task<IReadOnlyList<JobStatusConfig>> GetAllByUserAsync(int userId) =>
        await Ctx.JobStatusConfigs.Where(c => c.UserId == userId).ToListAsync();

    public async Task<JobStatusConfig?> GetByKeyAsync(string key, int userId) =>
        await Ctx.JobStatusConfigs.FirstOrDefaultAsync(c => c.Key == key && c.UserId == userId);

    public async Task<JobStatusConfig?> GetByIdAsync(int id, int userId) =>
        await Ctx.JobStatusConfigs.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var config = await GetByIdAsync(id, userId);
        if (config is null) return false;
        Ctx.JobStatusConfigs.Remove(config);
        await Ctx.SaveChangesAsync();
        return true;
    }
}
