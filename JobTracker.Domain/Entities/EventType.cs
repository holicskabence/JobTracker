namespace JobTracker.Domain.Entities;

public class EventType
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
}
