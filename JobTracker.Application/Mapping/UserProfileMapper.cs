using JobTracker.Application.DTOs;
using JobTracker.Domain.Entities;

namespace JobTracker.Application.Mapping;

public static class UserProfileMapper
{
    private static readonly string[] WorkModes = ["Remote", "Hybrid", "Onsite"];

    public static UserProfileResponse ToResponse(this AppUser u) =>
        new(u.Id, u.FirstName, u.LastName, u.Position, u.Email, u.Phone, u.Goal, u.JoinDate,
            u.AvatarBlobName is not null, u.UseAiEvaluation, u.PreferredLanguage,
            u.Location, u.TargetPosition, u.YearsOfExperience, u.PreferredWorkMode, u.PreferredLocations,
            u.SalaryExpectation, u.NoticePeriodDays, u.LinkedInUrl, u.GitHubUrl, u.PortfolioUrl, u.MainSkills);

    public static void ApplyCareerFields(this AppUser user, ICareerProfileFields fields)
    {
        user.Location = Text(fields.Location, 200);
        user.TargetPosition = Text(fields.TargetPosition, 200);
        user.YearsOfExperience = Count(fields.YearsOfExperience, 60);
        user.PreferredWorkMode = WorkMode(fields.PreferredWorkMode);
        user.PreferredLocations = Text(fields.PreferredLocations, 300);
        user.SalaryExpectation = Text(fields.SalaryExpectation, 100);
        user.NoticePeriodDays = Count(fields.NoticePeriodDays, 365);
        user.LinkedInUrl = Text(fields.LinkedInUrl, 300);
        user.GitHubUrl = Text(fields.GitHubUrl, 300);
        user.PortfolioUrl = Text(fields.PortfolioUrl, 300);
        user.MainSkills = Text(fields.MainSkills, 500);
    }

    private static string? Text(string? value, int maxLength)
    {
        var trimmed = value?.Trim();
        if (string.IsNullOrEmpty(trimmed)) return null;
        return trimmed.Length > maxLength ? trimmed[..maxLength] : trimmed;
    }

    private static string? WorkMode(string? value) =>
        WorkModes.FirstOrDefault(m => m.Equals(value?.Trim(), StringComparison.OrdinalIgnoreCase));

    private static int? Count(int? value, int max) =>
        value is null || value < 0 ? null : Math.Min(value.Value, max);
}
