namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IJobStatusHistoryRepository : IRepository<JobStatusHistory>
{
    Task<IReadOnlyList<JobStatusHistory>> GetAllByUserAsync(int userId);
}
