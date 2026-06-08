using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class UserProfileService(IAppUserRepository repo) : IUserProfileService
{
    public async Task<UserProfileResponse?> GetByIdAsync(int userId)
    {
        var user = await repo.GetByIdAsync(userId);
        return user is null ? null : Map(user);
    }

    public async Task<UserProfileResponse?> UpdateAsync(int userId, UpdateProfileRequest request)
    {
        var user = await repo.GetByIdAsync(userId);
        if (user is null) return null;

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.Position = request.Position.Trim();
        user.Email = request.Email.Trim();
        user.Phone = request.Phone.Trim();
        user.Goal = request.Goal;

        await repo.UpdateAsync(user);
        return Map(user);
    }

    public async Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request)
    {
        var user = await repo.GetByIdAsync(userId);
        if (user is null) return false;
        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash)) return false;

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await repo.UpdateAsync(user);
        return true;
    }

    private static UserProfileResponse Map(Domain.Entities.AppUser u) =>
        new(u.Id, u.FirstName, u.LastName, u.Position, u.Email, u.Phone, u.Goal, u.JoinDate);
}
