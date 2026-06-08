using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class JobStatusConfigRepository(JobTrackerDbContext ctx)
    : BaseRepository<JobStatusConfig>(ctx), IJobStatusConfigRepository
{
    public async Task<JobStatusConfig?> GetByKeyAsync(string key) =>
        await Ctx.JobStatusConfigs.FirstOrDefaultAsync(c => c.Key == key);
}
