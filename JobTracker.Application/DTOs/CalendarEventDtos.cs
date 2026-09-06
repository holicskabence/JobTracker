namespace JobTracker.Application.DTOs;

public record CalendarEventResponse(
    int Id,
    string Type,
    string Company,
    string Date,
    string Time,
    string Notes,
    int? JobId
);

public record CreateCalendarEventRequest(
    string Type,
    string Company,
    string Date,
    string Time,
    string Notes,
    int? JobId
);

public record UpdateCalendarEventRequest(
    string Type,
    string Company,
    string Date,
    string Time,
    string Notes,
    int? JobId
);
