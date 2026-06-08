using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IPlannerTaskService
{
    Task<IReadOnlyList<PlannerTaskResponse>> GetAllAsync(int userId);
    Task<PlannerTaskResponse> CreateAsync(int userId, CreatePlannerTaskRequest request);
    Task<PlannerTaskResponse?> ToggleAsync(int id, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
