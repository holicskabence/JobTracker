using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class CalendarEventRepository(JobTrackerDbContext ctx)
    : BaseRepository<CalendarEvent>(ctx), ICalendarEventRepository
{
    public async Task<IReadOnlyList<CalendarEvent>> GetUpcomingAsync(string fromDate) =>
        await Ctx.CalendarEvents
            .Where(e => string.Compare(e.Date, fromDate) >= 0)
            .OrderBy(e => e.Date)
            .ThenBy(e => e.Time)
            .ToListAsync();
}
