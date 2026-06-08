using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[Route("api/profile")]
public sealed class ProfileController(IUserProfileService svc) : AuthorizedControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get()
    {
        var profile = await svc.GetByIdAsync(CurrentUserId);
        return profile is null ? NotFound() : Ok(profile);
    }

    [HttpPut]
    public async Task<IActionResult> Update([FromBody] UpdateProfileRequest request)
    {
        var updated = await svc.UpdateAsync(CurrentUserId, request);
        return updated is null ? NotFound() : Ok(updated);
    }

    [HttpPatch("password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
    {
        var ok = await svc.ChangePasswordAsync(CurrentUserId, request);
        return ok ? NoContent() : BadRequest(new { message = "Hibás jelenlegi jelszó." });
    }
}
