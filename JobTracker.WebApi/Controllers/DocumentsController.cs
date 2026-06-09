using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/documents")]
public sealed class DocumentsController(IUserDocumentService svc) : AuthorizedControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync(CurrentUserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateUserDocumentRequest request)
    {
        var created = await svc.CreateAsync(CurrentUserId, request);
        return StatusCode(201, created);
    }

    [HttpPost("{id:int}/file")]
    [RequestSizeLimit(10 * 1024 * 1024)]
    public async Task<IActionResult> UploadFile(int id, IFormFile file)
    {
        if (file is null || file.Length == 0)
            return BadRequest(new { message = "Nincs feltöltött fájl." });

        await using var stream = file.OpenReadStream();
        var result = await svc.UploadFileAsync(id, CurrentUserId, stream, file.ContentType, file.FileName);
        return result is null
            ? NotFound(new { message = "A dokumentum nem található." })
            : Ok(result);
    }

    [HttpGet("{id:int}/file")]
    public async Task<IActionResult> DownloadFile(int id)
    {
        var result = await svc.DownloadFileAsync(id, CurrentUserId);
        if (result is null)
            return NotFound(new { message = "Nincs feltöltött fájl ehhez a dokumentumhoz." });

        var (content, contentType, fileName) = result.Value;
        return File(content, contentType, fileName);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound(new { message = "A dokumentum nem található." });
    }
}
