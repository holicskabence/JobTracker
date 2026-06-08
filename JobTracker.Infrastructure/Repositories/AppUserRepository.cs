using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class AppUserRepository(JobTrackerDbContext ctx)
    : BaseRepository<AppUser>(ctx), IAppUserRepository
{
    public async Task<AppUser?> GetByEmailAsync(string email) =>
        await Ctx.Users.FirstOrDefaultAsync(u => u.Email == email);
}
