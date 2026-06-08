using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IUserProfileService
{
    Task<UserProfileResponse?> GetByIdAsync(int userId);
    Task<UserProfileResponse?> UpdateAsync(int userId, UpdateProfileRequest request);
    Task<bool> ChangePasswordAsync(int userId, ChangePasswordRequest request);
}
