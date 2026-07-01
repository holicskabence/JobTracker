using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class JobStatusHistoryService(
    IJobStatusHistoryRepository historyRepo,
    IJobRepository jobRepo) : IJobStatusHistoryService
{
    public async Task<IReadOnlyList<JobStatusHistoryResponse>> GetAllAsync(int userId)
    {
        var histories = await historyRepo.GetAllByUserAsync(userId);
        var jobs = await jobRepo.GetAllByUserAsync(userId);
        var jobLookup = jobs.ToDictionary(j => j.Id);

        var result = new List<JobStatusHistoryResponse>();
        foreach (var group in histories.GroupBy(h => h.JobId))
        {
            if (!jobLookup.TryGetValue(group.Key, out var job)) continue;

            var ordered = group.OrderBy(h => h.ChangedAt).ThenBy(h => h.Id).ToList();
            string? previousStatus = null;
            foreach (var h in ordered)
            {
                result.Add(new JobStatusHistoryResponse(
                    h.Id, h.JobId, job.Company, job.Position, previousStatus, h.Status, h.ChangedAt));
                previousStatus = h.Status;
            }
        }

        return result
            .OrderByDescending(r => r.ChangedAt)
            .ThenByDescending(r => r.Id)
            .ToList();
    }
}
