using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class EventTypeService(IEventTypeRepository repo) : IEventTypeService
{
    public async Task<IReadOnlyList<EventTypeResponse>> GetAllAsync()
    {
        var types = await repo.GetAllAsync();
        return types.Select(Map).ToList();
    }

    public async Task<EventTypeResponse> CreateAsync(CreateEventTypeRequest request)
    {
        var type = new EventType { Name = request.Name };
        await repo.AddAsync(type);
        return Map(type);
    }

    public async Task<bool> DeleteAsync(int id) => await repo.DeleteAsync(id);

    private static EventTypeResponse Map(EventType t) => new(t.Id, t.Name);
}
