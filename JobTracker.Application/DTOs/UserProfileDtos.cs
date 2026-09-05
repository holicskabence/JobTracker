namespace JobTracker.Application.DTOs;

public interface ICareerProfileFields
{
    string? Location { get; }
    string? TargetPosition { get; }
    int? YearsOfExperience { get; }
    string? PreferredWorkMode { get; }
    string? PreferredLocations { get; }
    string? SalaryExpectation { get; }
    int? NoticePeriodDays { get; }
    string? LinkedInUrl { get; }
    string? GitHubUrl { get; }
    string? PortfolioUrl { get; }
    string? MainSkills { get; }
}

public record UserProfileResponse(
    int Id,
    string FirstName,
    string LastName,
    string Position,
    string Email,
    string Phone,
    int Goal,
    string JoinDate,
    bool HasAvatar,
    bool UseAiEvaluation,
    string PreferredLanguage,
    string? Location,
    string? TargetPosition,
    int? YearsOfExperience,
    string? PreferredWorkMode,
    string? PreferredLocations,
    string? SalaryExpectation,
    int? NoticePeriodDays,
    string? LinkedInUrl,
    string? GitHubUrl,
    string? PortfolioUrl,
    string? MainSkills
);

public record UpdateProfileRequest(
    string FirstName,
    string LastName,
    string Position,
    string Email,
    string Phone,
    int Goal,
    bool UseAiEvaluation,
    string PreferredLanguage,
    string? Location = null,
    string? TargetPosition = null,
    int? YearsOfExperience = null,
    string? PreferredWorkMode = null,
    string? PreferredLocations = null,
    string? SalaryExpectation = null,
    int? NoticePeriodDays = null,
    string? LinkedInUrl = null,
    string? GitHubUrl = null,
    string? PortfolioUrl = null,
    string? MainSkills = null
) : ICareerProfileFields;

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);
