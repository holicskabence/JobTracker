using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IJobStatusConfigService
{
    Task<IReadOnlyList<JobStatusConfigResponse>> GetAllAsync(int userId);
    Task<JobStatusConfigResponse?> CreateAsync(CreateJobStatusConfigRequest request, int userId);
    Task<JobStatusConfigResponse?> UpdateAsync(int id, UpdateJobStatusConfigRequest request, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<IReadOnlyList<JobStatusConfigResponse>> ReorderAsync(IEnumerable<ReorderStatusConfigItem> items, int userId);
}
