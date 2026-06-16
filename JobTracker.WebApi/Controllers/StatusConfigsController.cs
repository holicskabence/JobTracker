using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/status-configs")]
public sealed class StatusConfigsController(IJobStatusConfigService svc) : AuthorizedControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync(CurrentUserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateJobStatusConfigRequest request)
    {
        var created = await svc.CreateAsync(request, CurrentUserId);
        return created is null
            ? Conflict(new { message = "Ezzel a kulccsal már létezik státusz." })
            : StatusCode(201, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateJobStatusConfigRequest request)
    {
        var updated = await svc.UpdateAsync(id, request, CurrentUserId);
        return updated is null ? NotFound(new { message = "A státusz nem található." }) : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound(new { message = "A státusz nem található." });
    }

    [HttpPost("reorder")]
    public async Task<IActionResult> Reorder([FromBody] List<ReorderStatusConfigItem> items)
    {
        var result = await svc.ReorderAsync(items, CurrentUserId);
        return Ok(result);
    }
}
