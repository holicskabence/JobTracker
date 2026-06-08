namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IAppUserRepository : IRepository<AppUser>
{
    Task<AppUser?> GetByEmailAsync(string email);
}
