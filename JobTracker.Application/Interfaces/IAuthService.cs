using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponse?> LoginAsync(LoginRequest request);
    Task<AuthResponse?> RegisterAsync(RegisterRequest request);
    Task<AuthResponse?> GoogleLoginAsync(string idToken);
    Task<AuthResponse?> FacebookLoginAsync(string accessToken);
}
