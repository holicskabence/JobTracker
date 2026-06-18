using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class JobStatusHistoryRepository(JobTrackerDbContext ctx)
    : BaseRepository<JobStatusHistory>(ctx), IJobStatusHistoryRepository
{
    public async Task<IReadOnlyList<JobStatusHistory>> GetAllByUserAsync(int userId) =>
        await Ctx.JobStatusHistories.Where(h => h.UserId == userId).ToListAsync();
}
