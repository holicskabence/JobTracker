using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class JobService(IJobRepository repo, IJobStatusHistoryRepository historyRepo) : IJobService
{
    public async Task<IReadOnlyList<JobResponse>> GetAllAsync(int userId)
    {
        var jobs = await repo.GetAllByUserAsync(userId);
        return jobs.Select(Map).ToList();
    }

    public async Task<JobResponse?> GetByIdAsync(int id, int userId)
    {
        var job = await repo.GetByIdAsync(id, userId);
        return job is null ? null : Map(job);
    }

    public async Task<JobResponse> CreateAsync(int userId, CreateJobRequest request)
    {
        var job = new Job
        {
            UserId = userId,
            Company = request.Company,
            Position = request.Position,
            Link = request.Link,
            Date = request.Date,
            Status = request.Status,
            UpdatedAt = DateTime.UtcNow
        };
        await repo.AddAsync(job);
        await historyRepo.AddAsync(new JobStatusHistory
        {
            JobId = job.Id,
            UserId = userId,
            Status = job.Status,
            ChangedAt = DateOnly.TryParse(job.Date, out var appliedDate)
                ? appliedDate.ToDateTime(TimeOnly.MinValue)
                : DateTime.UtcNow
        });
        return Map(job);
    }

    public async Task<JobResponse?> UpdateAsync(int id, int userId, UpdateJobRequest request)
    {
        var job = await repo.GetByIdAsync(id, userId);
        if (job is null) return null;

        var previousStatus = job.Status;

        job.Company = request.Company;
        job.Position = request.Position;
        job.Link = request.Link;
        job.Date = request.Date;
        job.Status = request.Status;
        job.UpdatedAt = DateTime.UtcNow;

        await repo.UpdateAsync(job);

        if (previousStatus != job.Status)
        {
            await historyRepo.AddAsync(new JobStatusHistory
            {
                JobId = job.Id,
                UserId = userId,
                Status = job.Status,
                ChangedAt = DateTime.UtcNow
            });
        }

        return Map(job);
    }

    public async Task<JobResponse?> PatchStatusAsync(int id, int userId, PatchJobStatusRequest request)
    {
        var existing = await repo.GetByIdAsync(id, userId);
        if (existing is null) return null;

        var previousStatus = existing.Status;
        var job = await repo.PatchStatusAsync(id, userId, request.Status);
        if (job is null) return null;

        if (previousStatus != job.Status)
        {
            await historyRepo.AddAsync(new JobStatusHistory
            {
                JobId = job.Id,
                UserId = userId,
                Status = job.Status,
                ChangedAt = DateTime.UtcNow
            });
        }

        return Map(job);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    private static JobResponse Map(Job j) =>
        new(j.Id, j.Company, j.Position, j.Link, j.Date, j.Status);
}
