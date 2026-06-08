using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class StatsService(IJobRepository repo) : IStatsService
{
    public async Task<IReadOnlyList<MonthlyStatsResponse>> GetMonthlyAsync(int userId)
    {
        var jobs = await repo.GetAllByUserAsync(userId);

        return jobs
            .Where(j => !string.IsNullOrEmpty(j.Date) && j.Date.Length >= 7)
            .GroupBy(j => j.Date[..7])
            .OrderBy(g => g.Key)
            .Select(g => new MonthlyStatsResponse(
                Month: g.Key,
                Submitted: g.Count(),
                Callbacks: g.Count(j => j.Status is "Visszahivas" or "Ajanlat")))
            .ToList();
    }
}
