using JobTracker.Domain.Entities;

namespace JobTracker.Application.Interfaces;

public interface IJwtService
{
    string GenerateToken(AppUser user);
    int? GetUserIdFromToken(string token);
}
