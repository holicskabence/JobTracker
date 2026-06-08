namespace JobTracker.Application.DTOs;

public record RegisterRequest(
    string FirstName,
    string LastName,
    string Email,
    string Password
);

public record LoginRequest(string Email, string Password);

public record AuthResponse(string Token, UserProfileResponse Profile);
