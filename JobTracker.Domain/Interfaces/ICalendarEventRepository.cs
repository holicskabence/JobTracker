namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface ICalendarEventRepository : IRepository<CalendarEvent>
{
    Task<IReadOnlyList<CalendarEvent>> GetAllByUserAsync(int userId);
    Task<IReadOnlyList<CalendarEvent>> GetUpcomingAsync(string fromDate, int userId);
    Task<CalendarEvent?> GetByIdAsync(int id, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
