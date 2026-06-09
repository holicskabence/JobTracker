namespace JobTracker.Application.Interfaces;

public interface IBlobStorageService
{
    Task<string> UploadAsync(string blobName, Stream content, string contentType);
    Task<(Stream Content, string ContentType)> DownloadAsync(string blobName);
    Task DeleteAsync(string blobName);
}
