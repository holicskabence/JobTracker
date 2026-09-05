namespace JobTracker.Application.DTOs;

public record JobStatusConfigResponse(
    int Id,
    string Key,
    string Label,
    string Color,
    string? Description,
    int SortOrder,
    bool ShowInKanban,
    bool CountsAsApplication,
    bool CountsAsResponse,
    bool IsInterview,
    bool IsTerminal,
    string Outcome,
    int? StaleAfterDays);

public record CreateJobStatusConfigRequest(string Key, string Label, string Color);

public record UpdateJobStatusConfigRequest(
    string Label,
    string Color,
    string? Description,
    int SortOrder,
    bool ShowInKanban,
    bool CountsAsApplication,
    bool CountsAsResponse,
    bool IsInterview,
    bool IsTerminal,
    string Outcome,
    int? StaleAfterDays);

public record ReorderStatusConfigItem(int Id, int SortOrder);
