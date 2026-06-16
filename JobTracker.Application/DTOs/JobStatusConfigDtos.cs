namespace JobTracker.Application.DTOs;

public record JobStatusConfigResponse(int Id, string Key, string Label, string Color, int SortOrder, bool ShowInKanban);

public record CreateJobStatusConfigRequest(string Key, string Label, string Color);

public record UpdateJobStatusConfigRequest(string Label, string Color, int SortOrder, bool ShowInKanban);

public record ReorderStatusConfigItem(int Id, int SortOrder);
