using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[ApiController]
[Route("api/events")]
public sealed class EventsController(ICalendarEventService svc) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync());

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming() =>
        Ok(await svc.GetUpcomingAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ev = await svc.GetByIdAsync(id);
        return ev is null ? NotFound() : Ok(ev);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCalendarEventRequest request)
    {
        var created = await svc.CreateAsync(request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCalendarEventRequest request)
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
