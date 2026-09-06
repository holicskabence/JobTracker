namespace JobTracker.Application.DTOs;

public record JobResponse(
    int Id,
    string Company,
    string Position,
    string? Link,
    string? Source,
    string Date,
    string Status,
    string? Salary,
    string? OfficeLocation,
    string? WorkMode,
    string? Benefits,
    string? Description,
    DateTime UpdatedAt
);

public record CreateJobRequest(
    string Company,
    string Position,
    string? Link,
    string? Source,
    string Date,
    string Status
);

public record UpdateJobRequest(
    string Company,
    string Position,
    string? Link,
    string? Source,
    string Date,
    string Status,
    string? Salary,
    string? OfficeLocation,
    string? WorkMode,
    string? Benefits,
    string? Description
);

public record PatchJobStatusRequest(string Status);
