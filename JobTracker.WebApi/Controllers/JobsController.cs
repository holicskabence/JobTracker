using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[ApiController]
[Route("api/jobs")]
public sealed class JobsController(IJobService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var job = await svc.GetByIdAsync(id);
        return job is null ? NotFound() : Ok(job);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateJobRequest request)
    {
        var created = await svc.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateJobRequest request)
    {
        var updated = await svc.UpdateAsync(id, request);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPatch("{id:int}")]
    public async Task<IActionResult> PatchStatus(int id, [FromBody] PatchJobStatusRequest request)
    {
        var updated = await svc.PatchStatusAsync(id, request);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
