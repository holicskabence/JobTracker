using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[ApiController]
[Route("api/event-types")]
public sealed class EventTypesController(IEventTypeService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateEventTypeRequest request)
    {
        var created = await svc.CreateAsync(request);
        return StatusCode(201, created);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
