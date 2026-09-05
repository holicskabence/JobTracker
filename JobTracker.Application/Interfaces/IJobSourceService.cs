using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IJobSourceService
{
    Task<IReadOnlyList<JobSourceResponse>> GetAllAsync(int userId);
    Task<JobSourceResponse?> CreateAsync(CreateJobSourceRequest request, int userId);
    Task<JobSourceResponse?> UpdateAsync(int id, UpdateJobSourceRequest request, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
