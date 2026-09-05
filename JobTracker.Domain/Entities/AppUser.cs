namespace JobTracker.Domain.Entities;

public class AppUser
{
    public int Id { get; set; }
    public string FirstName { get; set; } = string.Empty;
    public string LastName { get; set; } = string.Empty;
    public string Position { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public int Goal { get; set; } = 30;
    public string JoinDate { get; set; } = string.Empty;
    public string? AvatarBlobName { get; set; }
    public bool UseAiEvaluation { get; set; } = false;
    public string? GoogleId { get; set; }
    public string? FacebookId { get; set; }
    public string PreferredLanguage { get; set; } = "hu";
    public string? Location { get; set; }
    public string? TargetPosition { get; set; }
    public int? YearsOfExperience { get; set; }
    public string? PreferredWorkMode { get; set; }
    public string? PreferredLocations { get; set; }
    public string? SalaryExpectation { get; set; }
    public int? NoticePeriodDays { get; set; }
    public string? LinkedInUrl { get; set; }
    public string? GitHubUrl { get; set; }
    public string? PortfolioUrl { get; set; }
    public string? MainSkills { get; set; }
}
