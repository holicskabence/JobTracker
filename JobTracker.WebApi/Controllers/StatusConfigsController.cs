using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;


[ApiController]
[Route("api/status-configs")]
[Authorize]
public sealed class StatusConfigsController(IJobStatusConfigService svc) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateJobStatusConfigRequest request)
    {
        var created = await svc.CreateAsync(request);
        return StatusCode(201, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateJobStatusConfigRequest request)
    {
        var updated = await svc.UpdateAsync(id, request);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
