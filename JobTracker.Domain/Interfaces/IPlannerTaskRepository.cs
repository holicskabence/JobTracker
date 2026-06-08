namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IPlannerTaskRepository : IRepository<PlannerTask>
{
    Task<PlannerTask?> ToggleCompletedAsync(int id);
}
