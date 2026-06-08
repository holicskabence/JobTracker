using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class UserDocumentRepository(JobTrackerDbContext ctx)
    : BaseRepository<UserDocument>(ctx), IUserDocumentRepository
{
    public async Task<IReadOnlyList<UserDocument>> GetAllByUserAsync(int userId) =>
        await Ctx.UserDocuments.Where(d => d.UserId == userId).ToListAsync();

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var doc = await Ctx.UserDocuments.FirstOrDefaultAsync(d => d.Id == id && d.UserId == userId);
        if (doc is null) return false;
        Ctx.UserDocuments.Remove(doc);
        await Ctx.SaveChangesAsync();
        return true;
    }
}
