namespace JobTracker.Application.DTOs;

public record CalendarEventResponse(
    int Id,
    string Type,
    string Company,
    string Date,
    string Time,
    string Notes
);

public record CreateCalendarEventRequest(
    string Type,
    string Company,
    string Date,
    string Time,
    string Notes
);

public record UpdateCalendarEventRequest(
    string Type,
    string Company,
    string Date,
    string Time,
    string Notes
);
