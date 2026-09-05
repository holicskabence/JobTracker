namespace JobTracker.Domain.Entities;

public class JobStatusConfig
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public string? Description { get; set; }
    public int SortOrder { get; set; }
    public bool ShowInKanban { get; set; } = true;

    public bool CountsAsApplication { get; set; }
    public bool CountsAsResponse { get; set; }
    public bool IsInterview { get; set; }
    public bool IsTerminal { get; set; }

    /// <summary>Open, Success, Rejected, Withdrawn or Ghosted.</summary>
    public string Outcome { get; set; } = StatusOutcomes.Open;

    /// <summary>Days after which an application sitting in this status is reported as stalled. Null turns the check off.</summary>
    public int? StaleAfterDays { get; set; }
}

public static class StatusOutcomes
{
    public const string Open = "Open";
    public const string Success = "Success";
    public const string Rejected = "Rejected";
    public const string Withdrawn = "Withdrawn";
    public const string Ghosted = "Ghosted";

    public static readonly string[] All = [Open, Success, Rejected, Withdrawn, Ghosted];

    public static bool IsClosed(string outcome) => outcome != Open;

    public static string Normalize(string? outcome) =>
        All.FirstOrDefault(o => string.Equals(o, outcome?.Trim(), StringComparison.OrdinalIgnoreCase)) ?? Open;
}
