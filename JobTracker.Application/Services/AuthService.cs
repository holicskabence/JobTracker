using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class AuthService(IAppUserRepository repo, IJwtService jwt) : IAuthService
{
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await repo.GetByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)) return null;

        return new AuthResponse(jwt.GenerateToken(user), MapProfile(user));
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var user = new AppUser
        {
            FirstName    = request.FirstName.Trim(),
            LastName     = request.LastName.Trim(),
            Email        = request.Email.Trim().ToLowerInvariant(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone        = string.Empty,
            Position     = string.Empty,
            Goal         = 30,
            JoinDate     = DateTime.Now.ToString("yyyy. MMMM", new System.Globalization.CultureInfo("hu-HU"))
        };
        await repo.AddAsync(user);
        return new AuthResponse(jwt.GenerateToken(user), MapProfile(user));
    }

    private static UserProfileResponse MapProfile(AppUser u) =>
        new(u.Id, u.FirstName, u.LastName, u.Position, u.Email, u.Phone, u.Goal, u.JoinDate);
}
