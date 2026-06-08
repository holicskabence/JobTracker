namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IJobRepository : IRepository<Job>
{
    Task<Job?> PatchStatusAsync(int id, string status);
}
