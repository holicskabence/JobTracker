namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IEventTypeRepository : IRepository<EventType>
{
    Task<EventType?> GetByNameAsync(string name);
}
