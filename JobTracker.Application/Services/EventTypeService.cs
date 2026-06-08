using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class EventTypeService(IEventTypeRepository repo) : IEventTypeService
{
    public async Task<IReadOnlyList<EventTypeResponse>> GetAllAsync(int userId)
    {
        var types = await repo.GetAllByUserAsync(userId);
        return types.Select(Map).ToList();
    }

    public async Task<EventTypeResponse?> CreateAsync(CreateEventTypeRequest request, int userId)
    {
        if (await repo.GetByNameAsync(request.Name, userId) is not null) return null;

        var type = new EventType { Name = request.Name, UserId = userId };
        await repo.AddAsync(type);
        return Map(type);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    private static EventTypeResponse Map(EventType t) => new(t.Id, t.Name);
}
