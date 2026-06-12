namespace JobTracker.Domain.Entities;

public class PracticeAttempt
{
    public int Id { get; set; }
    public int UserId { get; set; }
    public int PracticeQuestionId { get; set; }
    public string Category { get; set; } = string.Empty;
    public string Question { get; set; } = string.Empty;
    public string UserAnswer { get; set; } = string.Empty;
    public string Feedback { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
