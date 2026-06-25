using System.Globalization;
using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class StatsService(IJobStatusHistoryRepository historyRepo) : IStatsService
{
    public async Task<IReadOnlyList<StatsSeriesPoint>> GetSeriesAsync(int userId, string granularity)
    {
        var history = await historyRepo.GetAllByUserAsync(userId);
        if (history.Count == 0) return [];

        var keyFn = PeriodKeyFn(granularity);

        // Each status change is attributed to the period it happened in, so a job that
        // moves through several statuses on the same day shows up under all of them.
        var countsByPeriod = history
            .GroupBy(h => keyFn(DateOnly.FromDateTime(h.ChangedAt)))
            .ToDictionary(
                g => g.Key,
                g => g.GroupBy(h => h.Status).ToDictionary(sg => sg.Key, sg => sg.Count()));

        var earliest = DateOnly.FromDateTime(history.Min(h => h.ChangedAt));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var periods = BuildPeriods(earliest, today, granularity);

        var points = periods
            .Select(key => new StatsSeriesPoint(
                key,
                countsByPeriod.TryGetValue(key, out var counts) ? counts : []))
            .ToList();

        var limit = granularity switch
        {
            "day" => 30,
            "week" => 12,
            _ => 12
        };

        return points.Count > limit ? points.Skip(points.Count - limit).ToList() : points;
    }

    private static List<string> BuildPeriods(DateOnly start, DateOnly end, string granularity)
    {
        var keyFn = PeriodKeyFn(granularity);
        var periods = new List<string>();

        for (var date = start; date <= end; date = date.AddDays(1))
        {
            var key = keyFn(date);
            if (periods.Count == 0 || periods[^1] != key)
                periods.Add(key);
        }

        return periods;
    }

    private static Func<DateOnly, string> PeriodKeyFn(string granularity) => granularity switch
    {
        "day" => d => d.ToString("yyyy-MM-dd"),
        "week" => d => $"{ISOWeek.GetYear(d.ToDateTime(TimeOnly.MinValue))}-W{ISOWeek.GetWeekOfYear(d.ToDateTime(TimeOnly.MinValue)):D2}",
        _ => d => d.ToString("yyyy-MM")
    };
}
