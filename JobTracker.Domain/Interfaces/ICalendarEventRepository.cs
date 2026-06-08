namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface ICalendarEventRepository : IRepository<CalendarEvent>
{
    Task<IReadOnlyList<CalendarEvent>> GetUpcomingAsync(string fromDate);
}
