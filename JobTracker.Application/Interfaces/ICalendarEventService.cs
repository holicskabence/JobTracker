using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface ICalendarEventService
{
    Task<IReadOnlyList<CalendarEventResponse>> GetAllAsync();
    Task<IReadOnlyList<CalendarEventResponse>> GetUpcomingAsync();
    Task<CalendarEventResponse?> GetByIdAsync(int id);
    Task<CalendarEventResponse> CreateAsync(CreateCalendarEventRequest request);
    Task<CalendarEventResponse?> UpdateAsync(int id, UpdateCalendarEventRequest request);
    Task<bool> DeleteAsync(int id);
}
