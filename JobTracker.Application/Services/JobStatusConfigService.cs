using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class JobStatusConfigService(IJobStatusConfigRepository repo) : IJobStatusConfigService
{
    public async Task<IReadOnlyList<JobStatusConfigResponse>> GetAllAsync(int userId)
    {
        var configs = await repo.GetAllByUserAsync(userId);
        return configs.OrderBy(c => c.SortOrder).Select(Map).ToList();
    }

    public async Task<JobStatusConfigResponse?> CreateAsync(CreateJobStatusConfigRequest request, int userId)
    {
        var key = request.Key.Trim();
        if (await repo.GetByKeyAsync(key, userId) is not null) return null;

        var all = await repo.GetAllByUserAsync(userId);
        var config = new JobStatusConfig
        {
            UserId = userId,
            Key = key,
            Label = request.Label.Trim(),
            Color = request.Color,
            SortOrder = all.Count > 0 ? all.Max(c => c.SortOrder) + 1 : 0,
            ShowInKanban = true,
            CountsAsApplication = true,
            Outcome = StatusOutcomes.Open
        };
        await repo.AddAsync(config);
        return Map(config);
    }

    public async Task<JobStatusConfigResponse?> UpdateAsync(int id, UpdateJobStatusConfigRequest request, int userId)
    {
        var config = await repo.GetByIdAsync(id, userId);
        if (config is null) return null;

        var label = request.Label.Trim();
        if (label.Length == 0) return null;

        config.Label = label;
        config.Color = request.Color;
        config.Description = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        config.SortOrder = request.SortOrder;
        config.ShowInKanban = request.ShowInKanban;
        config.CountsAsApplication = request.CountsAsApplication;
        config.CountsAsResponse = request.CountsAsResponse;
        config.IsInterview = request.IsInterview;
        config.IsTerminal = request.IsTerminal;
        config.Outcome = StatusOutcomes.Normalize(request.Outcome);
        config.StaleAfterDays = request.StaleAfterDays;
        ApplyInvariants(config);

        await repo.UpdateAsync(config);
        return Map(config);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    public async Task<IReadOnlyList<JobStatusConfigResponse>> ReorderAsync(IEnumerable<ReorderStatusConfigItem> items, int userId)
    {
        var all = await repo.GetAllByUserAsync(userId);
        foreach (var item in items)
        {
            var config = all.FirstOrDefault(c => c.Id == item.Id);
            if (config is null) continue;
            config.SortOrder = item.SortOrder;
            await repo.UpdateAsync(config);
        }
        var updated = await repo.GetAllByUserAsync(userId);
        return updated.OrderBy(c => c.SortOrder).Select(Map).ToList();
    }

    /// <summary>Keeps the flags consistent so a metric can never have a larger denominator than its own numerator.</summary>
    private static void ApplyInvariants(JobStatusConfig config)
    {
        if (StatusOutcomes.IsClosed(config.Outcome))
        {
            config.IsTerminal = true;
            config.CountsAsApplication = true;
            if (config.Outcome is StatusOutcomes.Success or StatusOutcomes.Rejected) config.CountsAsResponse = true;
        }
        if (config.IsInterview) config.CountsAsResponse = true;
        if (config.CountsAsResponse) config.CountsAsApplication = true;

        config.StaleAfterDays = config.IsTerminal || config.StaleAfterDays is null or < 1
            ? null
            : Math.Min(config.StaleAfterDays.Value, 365);
    }

    private static JobStatusConfigResponse Map(JobStatusConfig c) =>
        new(c.Id, c.Key, c.Label, c.Color, c.Description, c.SortOrder, c.ShowInKanban,
            c.CountsAsApplication, c.CountsAsResponse, c.IsInterview, c.IsTerminal, c.Outcome, c.StaleAfterDays);
}
