namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IAppUserRepository : IRepository<AppUser>
{
    Task<AppUser?> GetByEmailAsync(string email);
    Task<AppUser?> GetByGoogleIdAsync(string googleId);
    Task<AppUser?> GetByFacebookIdAsync(string facebookId);
}
