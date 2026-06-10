using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/practice-questions")]
public sealed class PracticeQuestionsController(IPracticeQuestionService svc) : AuthorizedControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync(CurrentUserId));

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreatePracticeQuestionRequest request)
    {
        var created = await svc.CreateAsync(request, CurrentUserId);
        return StatusCode(201, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdatePracticeQuestionRequest request)
    {
        var updated = await svc.UpdateAsync(id, request, CurrentUserId);
        return updated is null ? NotFound(new { message = "A kérdés nem található." }) : Ok(updated);
    }

    [HttpPatch("{id:int}/feedback")]
    public async Task<IActionResult> SetFeedback(int id, [FromBody] RatePracticeQuestionRequest request)
    {
        var updated = await svc.SetFeedbackAsync(id, request, CurrentUserId);
        return updated is null ? NotFound(new { message = "A kérdés nem található." }) : Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var deleted = await svc.DeleteAsync(id, CurrentUserId);
        return deleted ? NoContent() : NotFound(new { message = "A kérdés nem található." });
    }

    [HttpPost("{id:int}/evaluate")]
    public async Task<IActionResult> EvaluateAnswer(int id, [FromBody] AiEvaluateRequest request)
    {
        var result = await svc.EvaluateAnswerAsync(id, CurrentUserId, request.UserAnswer, request.CustomPrompt);
        return result is null ? NotFound(new { message = "A kérdés nem található." }) : Ok(result);
    }
}
