using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class PlannerTaskRepository(JobTrackerDbContext ctx)
    : BaseRepository<PlannerTask>(ctx), IPlannerTaskRepository
{
    public async Task<IReadOnlyList<PlannerTask>> GetAllByUserAsync(int userId) =>
        await Ctx.PlannerTasks.Where(t => t.UserId == userId).ToListAsync();

    public async Task<PlannerTask?> ToggleCompletedAsync(int id, int userId)
    {
        var task = await Ctx.PlannerTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return null;
        task.Completed = !task.Completed;
        await Ctx.SaveChangesAsync();
        return task;
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var task = await Ctx.PlannerTasks.FirstOrDefaultAsync(t => t.Id == id && t.UserId == userId);
        if (task is null) return false;
        Ctx.PlannerTasks.Remove(task);
        await Ctx.SaveChangesAsync();
        return true;
    }
}
