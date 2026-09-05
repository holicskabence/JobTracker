namespace JobTracker.Application.DTOs;

public record RegisterRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password,
    string? PreferredLanguage = null,
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

public record LoginRequest(string Email, string Password);

public record ExternalAuthRequest(string Token);

public record AuthResponse(string Token, UserProfileResponse Profile);
