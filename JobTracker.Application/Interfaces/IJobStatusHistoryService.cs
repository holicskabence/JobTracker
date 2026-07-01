using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IJobStatusHistoryService
{
    Task<IReadOnlyList<JobStatusHistoryResponse>> GetAllAsync(int userId);
}
