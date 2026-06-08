using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;

namespace JobTracker.Infrastructure.Repositories;

public sealed class JobRepository(JobTrackerDbContext ctx)
    : BaseRepository<Job>(ctx), IJobRepository
{
    public async Task<Job?> PatchStatusAsync(int id, string status)
    {
        var job = await Ctx.Jobs.FindAsync(id);
        if (job is null) return null;
        job.Status = status;
        await Ctx.SaveChangesAsync();
        return job;
    }
}
