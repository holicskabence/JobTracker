using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/practice-categories")]
public sealed class PracticeCategoriesController(IPracticeCategoryService svc) : AuthorizedControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync(CurrentUserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePracticeCategoryRequest request)
    {
        var created = await svc.CreateAsync(request, CurrentUserId);
        return created is null
            ? Conflict(new { message = "Ezzel a névvel már létezik kategória." })
            : StatusCode(201, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePracticeCategoryRequest request)
    {
        var updated = await svc.UpdateAsync(id, request, CurrentUserId);
        return updated is null ? NotFound(new { message = "A kategória nem található." }) : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound(new { message = "A kategória nem található." });
    }
}
