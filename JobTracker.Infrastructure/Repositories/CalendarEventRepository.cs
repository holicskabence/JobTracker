using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class CalendarEventRepository(JobTrackerDbContext ctx)
    : BaseRepository<CalendarEvent>(ctx), ICalendarEventRepository
{
    public async Task<IReadOnlyList<CalendarEvent>> GetAllByUserAsync(int userId) =>
        await Ctx.CalendarEvents.Where(e => e.UserId == userId).ToListAsync();

    public async Task<IReadOnlyList<CalendarEvent>> GetUpcomingAsync(string fromDate, int userId) =>
        await Ctx.CalendarEvents
            .Where(e => e.UserId == userId && string.Compare(e.Date, fromDate) >= 0)
            .OrderBy(e => e.Date)
            .ThenBy(e => e.Time)
            .ToListAsync();

    public async Task<CalendarEvent?> GetByIdAsync(int id, int userId) =>
        await Ctx.CalendarEvents.FirstOrDefaultAsync(e => e.Id == id && e.UserId == userId);

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var ev = await GetByIdAsync(id, userId);
        if (ev is null) return false;
        Ctx.CalendarEvents.Remove(ev);
        await Ctx.SaveChangesAsync();
        return true;
    }
}
