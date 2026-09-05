using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class JobSourceService(IJobSourceRepository repo, IJobRepository jobRepo) : IJobSourceService
{
    public async Task<IReadOnlyList<JobSourceResponse>> GetAllAsync(int userId)
    {
        var sources = await repo.GetAllByUserAsync(userId);
        if (sources.Count == 0)
        {
            await repo.AddRangeAsync(DefaultJobSources.For(userId));
            sources = await repo.GetAllByUserAsync(userId);
        }
        return sources.Select(Map).ToList();
    }

    public async Task<JobSourceResponse?> CreateAsync(CreateJobSourceRequest request, int userId)
    {
        var name = request.Name.Trim();
        if (name.Length == 0) return null;
        if (await repo.GetByNameAsync(name, userId) is not null) return null;

        var source = new JobSource { UserId = userId, Name = name, MatchPattern = Normalize(request.MatchPattern) };
        await repo.AddAsync(source);
        return Map(source);
    }

    public async Task<JobSourceResponse?> UpdateAsync(int id, UpdateJobSourceRequest request, int userId)
    {
        var source = await repo.GetByIdAsync(id, userId);
        if (source is null) return null;

        var oldName = source.Name;
        var newName = request.Name.Trim();
        if (newName.Length == 0) return null;

        var clash = await repo.GetByNameAsync(newName, userId);
        if (clash is not null && clash.Id != id) return null;

        source.Name = newName;
        source.MatchPattern = Normalize(request.MatchPattern);
        await repo.UpdateAsync(source);

        if (oldName != newName)
            await jobRepo.RenameSourceAsync(oldName, newName, userId);

        return Map(source);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    private static string? Normalize(string? pattern)
    {
        var trimmed = pattern?.Trim().ToLowerInvariant();
        return string.IsNullOrEmpty(trimmed) ? null : trimmed;
    }

    private static JobSourceResponse Map(JobSource s) => new(s.Id, s.Name, s.MatchPattern);
}
