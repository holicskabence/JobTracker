using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class UserProfileService(IAppUserRepository repo, IBlobStorageService blob) : IUserProfileService
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
        user.UseAiEvaluation = request.UseAiEvaluation;

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

    public async Task<UserProfileResponse?> UploadAvatarAsync(int userId, Stream content, string contentType)
    {
        var user = await repo.GetByIdAsync(userId);
        if (user is null) return null;

        var blobName = $"avatars/{userId}";
        await blob.UploadAsync(blobName, content, contentType);
        user.AvatarBlobName = blobName;
        await repo.UpdateAsync(user);
        return Map(user);
    }

    public async Task<(Stream Content, string ContentType)?> GetAvatarAsync(int userId)
    {
        var user = await repo.GetByIdAsync(userId);
        if (user?.AvatarBlobName is null) return null;
        return await blob.DownloadAsync(user.AvatarBlobName);
    }

    public async Task<bool> DeleteAvatarAsync(int userId)
    {
        var user = await repo.GetByIdAsync(userId);
        if (user is null) return false;
        if (user.AvatarBlobName is not null)
        {
            await blob.DeleteAsync(user.AvatarBlobName);
            user.AvatarBlobName = null;
            await repo.UpdateAsync(user);
        }
        return true;
    }

    private static UserProfileResponse Map(Domain.Entities.AppUser u) =>
        new(u.Id, u.FirstName, u.LastName, u.Position, u.Email, u.Phone, u.Goal, u.JoinDate, u.AvatarBlobName is not null, u.UseAiEvaluation);
}
