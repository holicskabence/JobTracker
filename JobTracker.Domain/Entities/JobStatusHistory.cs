namespace JobTracker.Domain.Entities;

public class JobStatusHistory
{
    public int Id { get; set; }
    public int JobId { get; set; }
    public int UserId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime ChangedAt { get; set; }
}
