using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class PracticeAttemptRepository(JobTrackerDbContext ctx)
    : BaseRepository<PracticeAttempt>(ctx), IPracticeAttemptRepository
{
    public async Task<IReadOnlyList<PracticeAttempt>> GetAllByUserAsync(int userId) =>
        await Ctx.PracticeAttempts
            .Where(a => a.UserId == userId)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync();

    public async Task DeleteAllByUserAsync(int userId)
    {
        await Ctx.PracticeAttempts
            .Where(a => a.UserId == userId)
            .ExecuteDeleteAsync();
    }
}
