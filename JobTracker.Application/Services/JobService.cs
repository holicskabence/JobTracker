using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class JobService(IJobRepository repo) : IJobService
{
    public async Task<IReadOnlyList<JobResponse>> GetAllAsync()
    {
        var jobs = await repo.GetAllAsync();
        return jobs.Select(Map).ToList();
    }

    public async Task<JobResponse?> GetByIdAsync(int id)
    {
        var job = await repo.GetByIdAsync(id);
        return job is null ? null : Map(job);
    }

    public async Task<JobResponse> CreateAsync(CreateJobRequest request)
    {
        var job = new Job
        {
            Company = request.Company,
            Position = request.Position,
            Link = request.Link,
            Date = request.Date,
            Status = request.Status
        };
        await repo.AddAsync(job);
        return Map(job);
    }

    public async Task<JobResponse?> UpdateAsync(int id, UpdateJobRequest request)
    {
        var job = await repo.GetByIdAsync(id);
        if (job is null) return null;

        job.Company = request.Company;
        job.Position = request.Position;
        job.Link = request.Link;
        job.Date = request.Date;
        job.Status = request.Status;

        await repo.UpdateAsync(job);
        return Map(job);
    }

    public async Task<JobResponse?> PatchStatusAsync(int id, PatchJobStatusRequest request)
    {
        var job = await repo.PatchStatusAsync(id, request.Status);
        return job is null ? null : Map(job);
    }

    public async Task<bool> DeleteAsync(int id) => await repo.DeleteAsync(id);

    private static JobResponse Map(Job j) =>
        new(j.Id, j.Company, j.Position, j.Link, j.Date, j.Status);
}
