namespace JobTracker.Application.DTOs;

public record EventTypeResponse(int Id, string Name);

public record CreateEventTypeRequest(string Name);

public record UpdateEventTypeRequest(string Name);
