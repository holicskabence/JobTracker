using System.Globalization;
using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class StatsService(IJobRepository repo) : IStatsService
{
    public async Task<IReadOnlyList<StatsSeriesPoint>> GetSeriesAsync(int userId, string granularity)
    {
        var jobs = await repo.GetAllByUserAsync(userId);

        var validJobs = jobs
            .Where(j => DateOnly.TryParse(j.Date, out _))
            .ToList();

        var grouped = granularity switch
        {
            "day" => GroupByDay(validJobs),
            "week" => GroupByWeek(validJobs),
            _ => GroupByMonth(validJobs)
        };

        var limit = granularity switch
        {
            "day" => 30,
            "week" => 12,
            _ => 12
        };

        return grouped.Count > limit
            ? grouped.Skip(grouped.Count - limit).ToList()
            : grouped;
    }

    private static List<StatsSeriesPoint> GroupByDay(IEnumerable<Job> jobs) =>
        jobs
            .GroupBy(j => j.Date[..10])
            .OrderBy(g => g.Key)
            .Select(ToSeriesPoint)
            .ToList();

    private static List<StatsSeriesPoint> GroupByMonth(IEnumerable<Job> jobs) =>
        jobs
            .GroupBy(j => j.Date[..7])
            .OrderBy(g => g.Key)
            .Select(ToSeriesPoint)
            .ToList();

    private static List<StatsSeriesPoint> GroupByWeek(IEnumerable<Job> jobs) =>
        jobs
            .GroupBy(j =>
            {
                var date = DateOnly.Parse(j.Date[..10]).ToDateTime(TimeOnly.MinValue);
                return $"{ISOWeek.GetYear(date)}-W{ISOWeek.GetWeekOfYear(date):D2}";
            })
            .OrderBy(g => g.Key)
            .Select(ToSeriesPoint)
            .ToList();

    private static StatsSeriesPoint ToSeriesPoint(IGrouping<string, Job> g) =>
        new(g.Key, g.GroupBy(j => j.Status).ToDictionary(s => s.Key, s => s.Count()));
}
