namespace JobTracker.Application.DTOs;

public record StatsSeriesPoint(
    string Period,
    Dictionary<string, int> Counts
);
