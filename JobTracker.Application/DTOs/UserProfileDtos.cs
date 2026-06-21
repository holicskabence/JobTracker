namespace JobTracker.Application.DTOs;

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
    string PreferredLanguage
);

public record UpdateProfileRequest(
    string FirstName,
    string LastName,
    string Position,
    string Email,
    string Phone,
    int Goal,
    bool UseAiEvaluation,
    string PreferredLanguage
);

public record ChangePasswordRequest(
    string CurrentPassword,
    string NewPassword
);
