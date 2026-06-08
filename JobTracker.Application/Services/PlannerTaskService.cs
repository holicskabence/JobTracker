using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class PlannerTaskService(IPlannerTaskRepository repo) : IPlannerTaskService
{
    public async Task<IReadOnlyList<PlannerTaskResponse>> GetAllAsync(int userId)
    {
        var tasks = await repo.GetAllByUserAsync(userId);
        return tasks.Select(Map).ToList();
    }

    public async Task<PlannerTaskResponse> CreateAsync(int userId, CreatePlannerTaskRequest request)
    {
        var task = new PlannerTask
        {
            UserId = userId,
            Text = request.Text,
            Completed = false,
            SortOrder = 0
        };
        await repo.AddAsync(task);
        return Map(task);
    }

    public async Task<PlannerTaskResponse?> ToggleAsync(int id, int userId)
    {
        var task = await repo.ToggleCompletedAsync(id, userId);
        return task is null ? null : Map(task);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    private static PlannerTaskResponse Map(PlannerTask t) =>
        new(t.Id, t.Text, t.Completed, t.SortOrder);
}
