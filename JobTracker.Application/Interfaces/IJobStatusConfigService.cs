using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IJobStatusConfigService
{
    Task<IReadOnlyList<JobStatusConfigResponse>> GetAllAsync();
    Task<JobStatusConfigResponse> CreateAsync(CreateJobStatusConfigRequest request);
    Task<JobStatusConfigResponse?> UpdateAsync(int id, UpdateJobStatusConfigRequest request);
    Task<bool> DeleteAsync(int id);
}
