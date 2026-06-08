using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace JobTracker.WebApi.Controllers;

[ApiController]
[Route("api/auth")]
public sealed class AuthController(IAuthService svc) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest request)
    {
        var result = await svc.RegisterAsync(request);
        return Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await svc.LoginAsync(request);
        return result is null ? Unauthorized(new { message = "Hibás email cím vagy jelszó." }) : Ok(result);
    }
}
