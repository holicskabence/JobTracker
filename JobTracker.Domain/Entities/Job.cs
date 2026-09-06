namespace JobTracker.Domain.Entities;

public class Job
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Company { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string? Link { get; set; }
    public string? Source { get; set; }
    public string Date { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string? Salary { get; set; }
    public string? OfficeLocation { get; set; }
    public string? WorkMode { get; set; }
    public string? Benefits { get; set; }
    public string? Description { get; set; }
    public DateTime UpdatedAt { get; set; }
}
