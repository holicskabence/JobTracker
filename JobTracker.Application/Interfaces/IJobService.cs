using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IJobService
{
    Task<IReadOnlyList<JobResponse>> GetAllAsync(int userId);
    Task<JobResponse?> GetByIdAsync(int id, int userId);
    Task<JobResponse> CreateAsync(int userId, CreateJobRequest request);
    Task<JobResponse?> UpdateAsync(int id, int userId, UpdateJobRequest request);
    Task<JobResponse?> PatchStatusAsync(int id, int userId, PatchJobStatusRequest request);
    Task<bool> DeleteAsync(int id, int userId);
}
