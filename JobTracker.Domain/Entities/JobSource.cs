namespace JobTracker.Domain.Entities;

public class JobSource
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Name { get; set; } = string.Empty;

    /// <summary>Matched against the job link (case-insensitive substring) to guess the source automatically.</summary>
    public string? MatchPattern { get; set; }
}
