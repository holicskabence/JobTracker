namespace JobTracker.Domain.Entities;

public class PracticeCategory
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Color { get; set; } = string.Empty;
    public int SortOrder { get; set; }
    public bool IsHidden { get; set; }
}
