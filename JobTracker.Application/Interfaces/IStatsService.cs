using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IStatsService
{
    Task<IReadOnlyList<StatsSeriesPoint>> GetSeriesAsync(int userId, string granularity);
}
