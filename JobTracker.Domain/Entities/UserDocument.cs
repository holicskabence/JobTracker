namespace JobTracker.Domain.Entities;

public class UserDocument
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Type { get; set; } = string.Empty;
    public string Updated { get; set; } = string.Empty;
    public string Version { get; set; } = string.Empty;
}
