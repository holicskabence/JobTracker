namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IJobRepository : IRepository<Job>
{
    Task<IReadOnlyList<Job>> GetAllByUserAsync(int userId);
    Task<Job?> GetByIdAsync(int id, int userId);
    Task<Job?> PatchStatusAsync(int id, int userId, string status);
    Task<bool> DeleteAsync(int id, int userId);
}
