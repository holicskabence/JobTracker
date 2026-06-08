namespace JobTracker.Domain.Entities;

public class PlannerTask
{
    public int Id { get; set; }
    public string Text { get; set; } = string.Empty;
    public bool Completed { get; set; }
    public int SortOrder { get; set; }
}
