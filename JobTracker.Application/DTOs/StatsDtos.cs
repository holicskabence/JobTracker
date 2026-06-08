namespace JobTracker.Application.DTOs;

public record MonthlyStatsResponse(
    string Month,
    int Submitted,
    int Callbacks
);
