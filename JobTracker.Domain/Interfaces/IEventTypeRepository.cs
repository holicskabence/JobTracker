namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IEventTypeRepository : IRepository<EventType>
{
    Task<IReadOnlyList<EventType>> GetAllByUserAsync(int userId);
    Task<EventType?> GetByNameAsync(string name, int userId);
    Task<EventType?> GetByIdAsync(int id, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
