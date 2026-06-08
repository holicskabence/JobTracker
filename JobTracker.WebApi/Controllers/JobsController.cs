using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/jobs")]
public sealed class JobsController(IJobService svc) : AuthorizedControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync(CurrentUserId));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var job = await svc.GetByIdAsync(id, CurrentUserId);
        return job is null ? NotFound(new { message = "A hirdetés nem található." }) : Ok(job);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateJobRequest request)
    {
        var created = await svc.CreateAsync(CurrentUserId, request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateJobRequest request)
    {
        var updated = await svc.UpdateAsync(id, CurrentUserId, request);
        return updated is null ? NotFound(new { message = "A hirdetés nem található." }) : Ok(updated);
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> PatchStatus(int id, [FromBody] PatchJobStatusRequest request)
    {
        var updated = await svc.PatchStatusAsync(id, CurrentUserId, request);
        return updated is null ? NotFound(new { message = "A hirdetés nem található." }) : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound(new { message = "A hirdetés nem található." });
    }
}
