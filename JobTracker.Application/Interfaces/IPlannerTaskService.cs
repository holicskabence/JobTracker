using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IPlannerTaskService
{
    Task<IReadOnlyList<PlannerTaskResponse>> GetAllAsync();
    Task<PlannerTaskResponse> CreateAsync(CreatePlannerTaskRequest request);
    Task<PlannerTaskResponse?> ToggleAsync(int id);
    Task<bool> DeleteAsync(int id);
}
