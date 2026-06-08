using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class UserDocumentService(IUserDocumentRepository repo) : IUserDocumentService
{
    public async Task<IReadOnlyList<UserDocumentResponse>> GetAllAsync()
    {
        var docs = await repo.GetAllAsync();
        return docs.Select(Map).ToList();
    }

    public async Task<UserDocumentResponse> CreateAsync(CreateUserDocumentRequest request)
    {
        var doc = new UserDocument
        {
            Name = request.Name,
            Type = request.Type,
            Updated = DateTime.Today.ToString("yyyy-MM-dd"),
            Version = request.Version
        };
        await repo.AddAsync(doc);
        return Map(doc);
    }

    public async Task<bool> DeleteAsync(int id) => await repo.DeleteAsync(id);

    private static UserDocumentResponse Map(UserDocument d) =>
        new(d.Id, d.Name, d.Type, d.Updated, d.Version);
}
