namespace JobTracker.Domain.Entities;

public class PracticeQuestion
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string Hint { get; set; } = string.Empty;
    public string SampleAnswer { get; set; } = string.Empty;
    public string? Feedback { get; set; }
}
