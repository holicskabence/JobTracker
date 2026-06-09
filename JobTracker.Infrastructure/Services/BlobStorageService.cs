using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using JobTracker.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace JobTracker.Infrastructure.Services;

public sealed class BlobStorageService : IBlobStorageService
{
    private readonly BlobContainerClient _container;

    public BlobStorageService(IConfiguration configuration)
    {
        var connectionString = configuration["AzureStorage:ConnectionString"]!;
        var containerName = configuration["AzureStorage:ContainerName"] ?? "user-documents";
        _container = new BlobContainerClient(connectionString, containerName);
    }

    public async Task<string> UploadAsync(string blobName, Stream content, string contentType)
    {
        await _container.CreateIfNotExistsAsync();
        var blob = _container.GetBlobClient(blobName);
        await blob.UploadAsync(content, new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        });
        return blobName;
    }

    public async Task<(Stream Content, string ContentType)> DownloadAsync(string blobName)
    {
        var blob = _container.GetBlobClient(blobName);
        var response = await blob.DownloadAsync();
        return (response.Value.Content, response.Value.ContentType);
    }

    public async Task DeleteAsync(string blobName)
    {
        var blob = _container.GetBlobClient(blobName);
        await blob.DeleteIfExistsAsync();
    }
}
