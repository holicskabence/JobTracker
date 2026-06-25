namespace JobTracker.Domain.Entities;

public class JobStatusConfig
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool ShowInKanban { get; set; } = true;

    /// <summary>Counts towards the Overview "active in progress" stat. A status can be combined with any other flag.</summary>
    public bool IsActive { get; set; }

    /// <summary>Counts towards the Overview "upcoming interviews" badge. A status can be combined with any other flag.</summary>
    public bool IsInterview { get; set; }

    /// <summary>None, Success, or Rejected — mutually exclusive, drives the Overview "success/rejection ratio" stat.</summary>
    public string StatsCategory { get; set; } = "None";
}
