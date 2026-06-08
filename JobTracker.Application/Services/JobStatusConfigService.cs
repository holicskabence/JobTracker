using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class JobStatusConfigService(IJobStatusConfigRepository repo) : IJobStatusConfigService
{
    public async Task<IReadOnlyList<JobStatusConfigResponse>> GetAllAsync()
    {
        var configs = await repo.GetAllAsync();
        return configs.OrderBy(c => c.SortOrder).Select(Map).ToList();
    }

    public async Task<JobStatusConfigResponse> CreateAsync(CreateJobStatusConfigRequest request)
    {
        var all = await repo.GetAllAsync();
        var config = new JobStatusConfig
        {
            Key = request.Key.Trim(),
            Label = request.Label.Trim(),
            Color = request.Color,
            SortOrder = all.Count > 0 ? all.Max(c => c.SortOrder) + 1 : 0
        };
        await repo.AddAsync(config);
        return Map(config);
    }

    public async Task<JobStatusConfigResponse?> UpdateAsync(int id, UpdateJobStatusConfigRequest request)
    {
        var config = await repo.GetByIdAsync(id);
        if (config is null) return null;

        config.Label = request.Label.Trim();
        config.Color = request.Color;
        config.SortOrder = request.SortOrder;

        await repo.UpdateAsync(config);
        return Map(config);
    }

    public async Task<bool> DeleteAsync(int id) => await repo.DeleteAsync(id);

    private static JobStatusConfigResponse Map(JobStatusConfig c) =>
        new(c.Id, c.Key, c.Label, c.Color, c.SortOrder);
}
