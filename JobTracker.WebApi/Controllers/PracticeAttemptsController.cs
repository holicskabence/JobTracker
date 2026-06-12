using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/practice-attempts")]
public sealed class PracticeAttemptsController(IPracticeAttemptService svc) : AuthorizedControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync(CurrentUserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePracticeAttemptRequest request)
    {
        var created = await svc.CreateAsync(request, CurrentUserId);
        return created is null ? NotFound(new { message = "A kérdés nem található." }) : StatusCode(201, created);
    }
}
