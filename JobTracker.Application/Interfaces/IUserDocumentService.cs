using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IUserDocumentService
{
    Task<IReadOnlyList<UserDocumentResponse>> GetAllAsync(int userId);
    Task<UserDocumentResponse> CreateAsync(int userId, CreateUserDocumentRequest request);
    Task<bool> DeleteAsync(int id, int userId);
}
