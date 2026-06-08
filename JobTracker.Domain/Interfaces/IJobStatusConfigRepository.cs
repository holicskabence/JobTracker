namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IJobStatusConfigRepository : IRepository<JobStatusConfig>
{
    Task<JobStatusConfig?> GetByKeyAsync(string key);
}
