using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class PlannerTaskService(IPlannerTaskRepository repo) : IPlannerTaskService
{
    public async Task<IReadOnlyList<PlannerTaskResponse>> GetAllAsync()
    {
        var tasks = await repo.GetAllAsync();
        return tasks.Select(Map).ToList();
    }

    public async Task<PlannerTaskResponse> CreateAsync(CreatePlannerTaskRequest request)
    {
        var task = new PlannerTask
        {
            Text = request.Text,
            Completed = false,
            SortOrder = 0
        };
        await repo.AddAsync(task);
        return Map(task);
    }

    public async Task<PlannerTaskResponse?> ToggleAsync(int id)
    {
        var task = await repo.ToggleCompletedAsync(id);
        return task is null ? null : Map(task);
    }

    public async Task<bool> DeleteAsync(int id) => await repo.DeleteAsync(id);

    private static PlannerTaskResponse Map(PlannerTask t) =>
        new(t.Id, t.Text, t.Completed, t.SortOrder);
}
