namespace JobTracker.Application.DTOs;

public record JobStatusHistoryResponse(
    int Id,
    int JobId,
    string Company,
    string Position,
    string? PreviousStatus,
    string NewStatus,
    DateTime ChangedAt
);
