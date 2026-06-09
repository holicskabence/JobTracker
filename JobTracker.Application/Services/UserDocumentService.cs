using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class UserDocumentService(
    IUserDocumentRepository repo,
    IBlobStorageService blobStorage) : IUserDocumentService
{
    public async Task<IReadOnlyList<UserDocumentResponse>> GetAllAsync(int userId)
    {
        var docs = await repo.GetAllByUserAsync(userId);
        return docs.Select(Map).ToList();
    }

    public async Task<UserDocumentResponse> CreateAsync(int userId, CreateUserDocumentRequest request)
    {
        var doc = new UserDocument
        {
            UserId = userId,
            Name = request.Name,
            Type = request.Type,
            Updated = DateTime.Today.ToString("yyyy-MM-dd"),
            Version = request.Version
        };
        await repo.AddAsync(doc);
        return Map(doc);
    }

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var doc = await repo.GetByIdAndUserAsync(id, userId);
        if (doc is null) return false;
        if (doc.BlobName is not null)
            await blobStorage.DeleteAsync(doc.BlobName);
        return await repo.DeleteAsync(id, userId);
    }

    public async Task<UserDocumentResponse?> UploadFileAsync(int id, int userId, Stream content, string contentType, string originalFileName)
    {
        var doc = await repo.GetByIdAndUserAsync(id, userId);
        if (doc is null) return null;

        if (doc.BlobName is not null)
            await blobStorage.DeleteAsync(doc.BlobName);

        var blobName = $"{userId}/{Guid.NewGuid()}";
        await blobStorage.UploadAsync(blobName, content, contentType);

        doc.BlobName = blobName;
        doc.FileName = originalFileName;
        doc.Updated = DateTime.Today.ToString("yyyy-MM-dd");
        await repo.UpdateAsync(doc);

        return Map(doc);
    }

    public async Task<(Stream Content, string ContentType, string FileName)?> DownloadFileAsync(int id, int userId)
    {
        var doc = await repo.GetByIdAndUserAsync(id, userId);
        if (doc?.BlobName is null) return null;

        var (content, contentType) = await blobStorage.DownloadAsync(doc.BlobName);
        return (content, contentType, doc.FileName ?? "document");
    }

    private static UserDocumentResponse Map(UserDocument d) =>
        new(d.Id, d.Name, d.Type, d.Updated, d.Version, d.BlobName is not null, d.FileName);
}
