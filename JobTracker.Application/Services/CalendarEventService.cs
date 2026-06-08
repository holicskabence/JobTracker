using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class CalendarEventService(ICalendarEventRepository repo) : ICalendarEventService
{
    public async Task<IReadOnlyList<CalendarEventResponse>> GetAllAsync(int userId)
    {
        var events = await repo.GetAllByUserAsync(userId);
        return events.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<CalendarEventResponse>> GetUpcomingAsync(int userId)
    {
        var today = DateTime.Today.ToString("yyyy-MM-dd");
        var events = await repo.GetUpcomingAsync(today, userId);
        return events.Select(Map).ToList();
    }

    public async Task<CalendarEventResponse?> GetByIdAsync(int id, int userId)
    {
        var ev = await repo.GetByIdAsync(id, userId);
        return ev is null ? null : Map(ev);
    }

    public async Task<CalendarEventResponse> CreateAsync(int userId, CreateCalendarEventRequest request)
    {
        var ev = new CalendarEvent
        {
            UserId = userId,
            Type = request.Type,
            Company = request.Company,
            Date = request.Date,
            Time = request.Time,
            Notes = request.Notes
        };
        await repo.AddAsync(ev);
        return Map(ev);
    }

    public async Task<CalendarEventResponse?> UpdateAsync(int id, int userId, UpdateCalendarEventRequest request)
    {
        var ev = await repo.GetByIdAsync(id, userId);
        if (ev is null) return null;

        ev.Type = request.Type;
        ev.Company = request.Company;
        ev.Date = request.Date;
        ev.Time = request.Time;
        ev.Notes = request.Notes;

        await repo.UpdateAsync(ev);
        return Map(ev);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    private static CalendarEventResponse Map(CalendarEvent e) =>
        new(e.Id, e.Type, e.Company, e.Date, e.Time, e.Notes);
}
