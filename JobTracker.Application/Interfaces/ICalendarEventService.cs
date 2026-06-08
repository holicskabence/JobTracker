using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface ICalendarEventService
{
    Task<IReadOnlyList<CalendarEventResponse>> GetAllAsync(int userId);
    Task<IReadOnlyList<CalendarEventResponse>> GetUpcomingAsync(int userId);
    Task<CalendarEventResponse?> GetByIdAsync(int id, int userId);
    Task<CalendarEventResponse> CreateAsync(int userId, CreateCalendarEventRequest request);
    Task<CalendarEventResponse?> UpdateAsync(int id, int userId, UpdateCalendarEventRequest request);
    Task<bool> DeleteAsync(int id, int userId);
}
