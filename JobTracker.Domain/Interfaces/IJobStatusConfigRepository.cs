namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IJobStatusConfigRepository : IRepository<JobStatusConfig>
{
    Task<IReadOnlyList<JobStatusConfig>> GetAllByUserAsync(int userId);
    Task<JobStatusConfig?> GetByKeyAsync(string key, int userId);
    Task<JobStatusConfig?> GetByIdAsync(int id, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
