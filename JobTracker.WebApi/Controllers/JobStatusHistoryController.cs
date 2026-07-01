using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/job-status-history")]
public sealed class JobStatusHistoryController(IJobStatusHistoryService svc) : AuthorizedControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await svc.GetAllAsync(CurrentUserId));
}
