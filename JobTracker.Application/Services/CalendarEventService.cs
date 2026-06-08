using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class CalendarEventService(ICalendarEventRepository repo) : ICalendarEventService
{
    public async Task<IReadOnlyList<CalendarEventResponse>> GetAllAsync()
    {
        var events = await repo.GetAllAsync();
        return events.Select(Map).ToList();
    }

    public async Task<IReadOnlyList<CalendarEventResponse>> GetUpcomingAsync()
    {
        var today = DateTime.Today.ToString("yyyy-MM-dd");
        var events = await repo.GetUpcomingAsync(today);
        return events.Select(Map).ToList();
    }

    public async Task<CalendarEventResponse?> GetByIdAsync(int id)
    {
        var ev = await repo.GetByIdAsync(id);
        return ev is null ? null : Map(ev);
    }

    public async Task<CalendarEventResponse> CreateAsync(CreateCalendarEventRequest request)
    {
        var ev = new CalendarEvent
        {
            Type = request.Type,
            Company = request.Company,
            Date = request.Date,
            Time = request.Time,
            Notes = request.Notes
        };
        await repo.AddAsync(ev);
        return Map(ev);
    }

    public async Task<CalendarEventResponse?> UpdateAsync(int id, UpdateCalendarEventRequest request)
    {
        var ev = await repo.GetByIdAsync(id);
        if (ev is null) return null;

        ev.Type = request.Type;
        ev.Company = request.Company;
        ev.Date = request.Date;
        ev.Time = request.Time;
        ev.Notes = request.Notes;

        await repo.UpdateAsync(ev);
        return Map(ev);
    }

    public async Task<bool> DeleteAsync(int id) => await repo.DeleteAsync(id);

    private static CalendarEventResponse Map(CalendarEvent e) =>
        new(e.Id, e.Type, e.Company, e.Date, e.Time, e.Notes);
}
