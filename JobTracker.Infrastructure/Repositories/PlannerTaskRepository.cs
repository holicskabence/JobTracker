using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;

namespace JobTracker.Infrastructure.Repositories;

public sealed class PlannerTaskRepository(JobTrackerDbContext ctx)
    : BaseRepository<PlannerTask>(ctx), IPlannerTaskRepository
{
    public async Task<PlannerTask?> ToggleCompletedAsync(int id)
    {
        var task = await Ctx.PlannerTasks.FindAsync(id);
        if (task is null) return null;
        task.Completed = !task.Completed;
        await Ctx.SaveChangesAsync();
        return task;
    }
}
