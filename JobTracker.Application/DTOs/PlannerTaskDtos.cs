namespace JobTracker.Application.DTOs;

public record PlannerTaskResponse(
    int Id,
    string Text,
    bool Completed,
    int SortOrder
);

public record CreatePlannerTaskRequest(string Text);
