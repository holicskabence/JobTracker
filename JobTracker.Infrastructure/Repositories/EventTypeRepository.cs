using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class EventTypeRepository(JobTrackerDbContext ctx)
    : BaseRepository<EventType>(ctx), IEventTypeRepository
{
    public async Task<IReadOnlyList<EventType>> GetAllByUserAsync(int userId) =>
        await Ctx.EventTypes.Where(t => t.UserId == userId).ToListAsync();

    public async Task<EventType?> GetByNameAsync(string name, int userId) =>
        await Ctx.EventTypes.FirstOrDefaultAsync(t => t.Name == name && t.UserId == userId);

    public async Task<EventType?> GetByIdAsync(int id, int userId) =>
        await Ctx.EventTypes.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var type = await GetByIdAsync(id, userId);
        if (type is null) return false;
        Ctx.EventTypes.Remove(type);
        await Ctx.SaveChangesAsync();
        return true;
    }
}
