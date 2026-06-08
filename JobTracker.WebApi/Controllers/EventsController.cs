using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/events")]
public sealed class EventsController(ICalendarEventService svc) : AuthorizedControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync(CurrentUserId));

    [HttpGet("upcoming")]
    public async Task<IActionResult> GetUpcoming() =>
        Ok(await svc.GetUpcomingAsync(CurrentUserId));

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var ev = await svc.GetByIdAsync(id, CurrentUserId);
        return ev is null ? NotFound(new { message = "Az esemény nem található." }) : Ok(ev);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateCalendarEventRequest request)
    {
        var created = await svc.CreateAsync(CurrentUserId, request);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateCalendarEventRequest request)
    {
        var updated = await svc.UpdateAsync(id, CurrentUserId, request);
        return updated is null ? NotFound(new { message = "Az esemény nem található." }) : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound(new { message = "Az esemény nem található." });
    }
}
