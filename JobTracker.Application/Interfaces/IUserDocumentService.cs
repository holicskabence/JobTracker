using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IUserDocumentService
{
    Task<IReadOnlyList<UserDocumentResponse>> GetAllAsync();
    Task<UserDocumentResponse> CreateAsync(CreateUserDocumentRequest request);
    Task<bool> DeleteAsync(int id);
}
