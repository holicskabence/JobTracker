using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/stats")]
public sealed class StatsController(IStatsService svc) : AuthorizedControllerBase
{
    private static readonly HashSet<string> ValidGranularities = ["day", "week", "month"];

    [HttpGet("series")]
    public async Task<IActionResult> GetSeries([FromQuery] string granularity = "month")
    {
        var g = ValidGranularities.Contains(granularity) ? granularity : "month";
        return Ok(await svc.GetSeriesAsync(CurrentUserId, g));
    }
}
