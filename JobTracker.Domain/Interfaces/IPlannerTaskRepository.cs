namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IPlannerTaskRepository : IRepository<PlannerTask>
{
    Task<IReadOnlyList<PlannerTask>> GetAllByUserAsync(int userId);
    Task<PlannerTask?> ToggleCompletedAsync(int id, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
