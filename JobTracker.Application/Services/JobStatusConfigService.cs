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
            SortOrder = all.Count > 0 ? all.Max(c => c.SortOrder) + 1 : 0
        };
        await repo.AddAsync(config);
        return Map(config);
    }

    public async Task<JobStatusConfigResponse?> UpdateAsync(int id, UpdateJobStatusConfigRequest request, int userId)
    {
        var config = await repo.GetByIdAsync(id, userId);
        if (config is null) return null;

        config.Label = request.Label.Trim();
        config.Color = request.Color;
        config.SortOrder = request.SortOrder;

        await repo.UpdateAsync(config);
        return Map(config);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    private static JobStatusConfigResponse Map(JobStatusConfig c) =>
        new(c.Id, c.Key, c.Label, c.Color, c.SortOrder);
}
