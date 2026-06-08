using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IEventTypeService
{
    Task<IReadOnlyList<EventTypeResponse>> GetAllAsync(int userId);
    Task<EventTypeResponse?> CreateAsync(CreateEventTypeRequest request, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
