namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IUserDocumentRepository : IRepository<UserDocument>
{
    Task<IReadOnlyList<UserDocument>> GetAllByUserAsync(int userId);
    Task<UserDocument?> GetByIdAndUserAsync(int id, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
