namespace JobTracker.Application.DTOs;

public record EventTypeResponse(int Id, string Name, string Color);

public record CreateEventTypeRequest(string Name, string Color);

public record UpdateEventTypeRequest(string Name, string Color);
