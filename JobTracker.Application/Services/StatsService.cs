using System.Globalization;
using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class StatsService(IJobStatusHistoryRepository historyRepo) : IStatsService
{
    public async Task<IReadOnlyList<StatsSeriesPoint>> GetSeriesAsync(int userId, string granularity)
    {
        var history = await historyRepo.GetAllByUserAsync(userId);
        if (history.Count == 0) return [];

        var historyByJob = history
            .GroupBy(h => h.JobId)
            .ToDictionary(g => g.Key, g => g.OrderBy(h => h.ChangedAt).ToList());

        var earliest = DateOnly.FromDateTime(history.Min(h => h.ChangedAt));
        var today = DateOnly.FromDateTime(DateTime.UtcNow);

        var periods = BuildPeriods(earliest, today, granularity);

        var points = periods
            .Select(p => new StatsSeriesPoint(p.Key, CountByStatus(historyByJob, p.AsOf)))
            .ToList();

        var limit = granularity switch
        {
            "day" => 30,
            "week" => 12,
            _ => 12
        };

        return points.Count > limit ? points.Skip(points.Count - limit).ToList() : points;
    }

    // For each job, finds the status it held as of the given day (its most recent
    // transition on or before that day), then tallies how many jobs were in each status.
    private static Dictionary<string, int> CountByStatus(
        Dictionary<int, List<JobStatusHistory>> historyByJob, DateOnly asOf)
    {
        var counts = new Dictionary<string, int>();
        foreach (var entries in historyByJob.Values)
        {
            var status = StatusAsOf(entries, asOf);
            if (status is null) continue;
            counts[status] = counts.GetValueOrDefault(status) + 1;
        }
        return counts;
    }

    private static string? StatusAsOf(List<JobStatusHistory> entries, DateOnly asOf)
    {
        string? status = null;
        foreach (var entry in entries)
        {
            if (DateOnly.FromDateTime(entry.ChangedAt) > asOf) break;
            status = entry.Status;
        }
        return status;
    }

    private static List<(string Key, DateOnly AsOf)> BuildPeriods(DateOnly start, DateOnly end, string granularity)
    {
        var keyFn = PeriodKeyFn(granularity);
        var periods = new List<(string Key, DateOnly AsOf)>();

        for (var date = start; date <= end; date = date.AddDays(1))
        {
            var key = keyFn(date);
            if (periods.Count > 0 && periods[^1].Key == key)
                periods[^1] = (key, date);
            else
                periods.Add((key, date));
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
