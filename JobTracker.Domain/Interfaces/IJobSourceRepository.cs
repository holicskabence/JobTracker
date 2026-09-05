namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IJobSourceRepository : IRepository<JobSource>
{
    Task<IReadOnlyList<JobSource>> GetAllByUserAsync(int userId);
    Task<JobSource?> GetByNameAsync(string name, int userId);
    Task<JobSource?> GetByIdAsync(int id, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task AddRangeAsync(IEnumerable<JobSource> sources);
}
