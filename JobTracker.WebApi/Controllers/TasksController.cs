using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[ApiController]
[Route("api/tasks")]
public sealed class TasksController(IPlannerTaskService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePlannerTaskRequest request)
    {
        var created = await svc.CreateAsync(request);
        return StatusCode(201, created);
    }

    [HttpPatch("{id:int}/toggle")]
    public async Task<IActionResult> Toggle(int id)
    {
        var updated = await svc.ToggleAsync(id);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
