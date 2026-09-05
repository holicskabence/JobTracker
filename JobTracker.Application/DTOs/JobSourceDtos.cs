namespace JobTracker.Application.DTOs;

public record JobSourceResponse(int Id, string Name, string? MatchPattern);

public record CreateJobSourceRequest(string Name, string? MatchPattern);

public record UpdateJobSourceRequest(string Name, string? MatchPattern);
