using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class AuthService(
    IAppUserRepository repo,
    IJwtService jwt,
    IDemoResetService demoReset,
    IJobStatusConfigRepository statusConfigRepo) : IAuthService
{
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await repo.GetByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)) return null;

        await demoReset.ResetIfDemoAccountAsync(user.Id, user.Email);

        return new AuthResponse(jwt.GenerateToken(user), MapProfile(user));
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await repo.GetByEmailAsync(email) is not null) return null;

        var user = new AppUser
        {
            FirstName    = request.FirstName.Trim(),
            LastName     = request.LastName.Trim(),
            Email        = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone        = string.Empty,
            Position     = string.Empty,
            Goal         = 30,
            JoinDate     = DateTime.Now.ToString("yyyy. MMMM", new System.Globalization.CultureInfo("hu-HU"))
        };
        await repo.AddAsync(user);
        await SeedDefaultStatusConfigsAsync(user.Id);

        return new AuthResponse(jwt.GenerateToken(user), MapProfile(user));
    }

    private async Task SeedDefaultStatusConfigsAsync(int userId)
    {
        var defaults = new[]
        {
            new JobStatusConfig { UserId = userId, Key = "Mentett", Label = "Mentett", Color = "#9b9b99", SortOrder = 0 },
            new JobStatusConfig { UserId = userId, Key = "Beadva", Label = "Beadva", Color = "#5fb9fa", SortOrder = 1 },
            new JobStatusConfig { UserId = userId, Key = "Visszahivas", Label = "Visszahívás", Color = "#f59e0b", SortOrder = 2 },
            new JobStatusConfig { UserId = userId, Key = "Ajanlat", Label = "Ajánlat", Color = "#26ac00", SortOrder = 3 },
            new JobStatusConfig { UserId = userId, Key = "Elutasitva", Label = "Elutasítva", Color = "#ef4444", SortOrder = 4 }
        };
        foreach (var config in defaults) await statusConfigRepo.AddAsync(config);
    }

    private static UserProfileResponse MapProfile(AppUser u) =>
        new(u.Id, u.FirstName, u.LastName, u.Position, u.Email, u.Phone, u.Goal, u.JoinDate);
}
