using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IJobService
{
    Task<IReadOnlyList<JobResponse>> GetAllAsync();
    Task<JobResponse?> GetByIdAsync(int id);
    Task<JobResponse> CreateAsync(CreateJobRequest request);
    Task<JobResponse?> UpdateAsync(int id, UpdateJobRequest request);
    Task<JobResponse?> PatchStatusAsync(int id, PatchJobStatusRequest request);
    Task<bool> DeleteAsync(int id);
}
