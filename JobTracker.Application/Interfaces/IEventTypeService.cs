using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IEventTypeService
{
    Task<IReadOnlyList<EventTypeResponse>> GetAllAsync();
    Task<EventTypeResponse> CreateAsync(CreateEventTypeRequest request);
    Task<bool> DeleteAsync(int id);
}
