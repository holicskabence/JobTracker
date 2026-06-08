using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/stats")]
public sealed class StatsController(IStatsService svc) : AuthorizedControllerBase
{
    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthly() =>
        Ok(await svc.GetMonthlyAsync(CurrentUserId));
}
