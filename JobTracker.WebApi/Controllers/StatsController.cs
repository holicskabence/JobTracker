using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[ApiController]
[Route("api/stats")]
public sealed class StatsController(IStatsService svc) : ControllerBase
{
    [HttpGet("monthly")]
    public async Task<IActionResult> GetMonthly() =>
        Ok(await svc.GetMonthlyAsync());
}
