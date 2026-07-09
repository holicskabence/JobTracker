using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class JobRepository(JobTrackerDbContext ctx)
    : BaseRepository<Job>(ctx), IJobRepository
{
    public async Task<IReadOnlyList<Job>> GetAllByUserAsync(int userId) =>
        await Ctx.Jobs.Where(j => j.UserId == userId).OrderByDescending(j => j.Id).ToListAsync();

    public async Task<Job?> GetByIdAsync(int id, int userId) =>
        await Ctx.Jobs.FirstOrDefaultAsync(j => j.Id == id && j.UserId == userId);

    public async Task<Job?> PatchStatusAsync(int id, int userId, string status)
    {
        var job = await GetByIdAsync(id, userId);
        if (job is null) return null;
        job.Status = status;
        await Ctx.SaveChangesAsync();
        return job;
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var job = await GetByIdAsync(id, userId);
        if (job is null) return false;
        Ctx.Jobs.Remove(job);
        await Ctx.SaveChangesAsync();
        return true;
    }
}
