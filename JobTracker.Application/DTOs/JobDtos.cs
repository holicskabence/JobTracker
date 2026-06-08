namespace JobTracker.Application.DTOs;

public record JobResponse(
    int Id,
    string Company,
    string Position,
    string? Link,
    string Date,
    string Status
);

public record CreateJobRequest(
    string Company,
    string Position,
    string? Link,
    string Date,
    string Status
);

public record UpdateJobRequest(
    string Company,
    string Position,
    string? Link,
    string Date,
    string Status
);

public record PatchJobStatusRequest(string Status);
