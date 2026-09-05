using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class JobSourceRepository(JobTrackerDbContext ctx)
    : BaseRepository<JobSource>(ctx), IJobSourceRepository
{
    public async Task<IReadOnlyList<JobSource>> GetAllByUserAsync(int userId) =>
        await Ctx.JobSources.Where(s => s.UserId == userId).OrderBy(s => s.Id).ToListAsync();

    public async Task<JobSource?> GetByNameAsync(string name, int userId) =>
        await Ctx.JobSources.FirstOrDefaultAsync(s => s.Name == name && s.UserId == userId);

    public async Task<JobSource?> GetByIdAsync(int id, int userId) =>
        await Ctx.JobSources.FirstOrDefaultAsync(s => s.Id == id && s.UserId == userId);

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var source = await GetByIdAsync(id, userId);
        if (source is null) return false;
        Ctx.JobSources.Remove(source);
        await Ctx.SaveChangesAsync();
        return true;
    }

    public async Task AddRangeAsync(IEnumerable<JobSource> sources)
    {
        await Ctx.JobSources.AddRangeAsync(sources);
        await Ctx.SaveChangesAsync();
    }
}
