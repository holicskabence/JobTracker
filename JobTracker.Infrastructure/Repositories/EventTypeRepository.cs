using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class EventTypeRepository(JobTrackerDbContext ctx)
    : BaseRepository<EventType>(ctx), IEventTypeRepository
{
    public async Task<EventType?> GetByNameAsync(string name) =>
        await Ctx.EventTypes.FirstOrDefaultAsync(t => t.Name == name);
}
