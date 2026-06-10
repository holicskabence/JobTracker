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
        return result is null
            ? Conflict(new { message = "Ezzel az email címmel már regisztráltak felhasználót." })
            : Ok(result);
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest request)
    {
        var result = await svc.LoginAsync(request);
        return result is null ? Unauthorized(new { message = "Hibás email cím vagy jelszó." }) : Ok(result);
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleLogin([FromBody] ExternalAuthRequest request)
    {
        var result = await svc.GoogleLoginAsync(request.Token);
        return result is null
            ? Unauthorized(new { message = "Sikertelen Google bejelentkezés." })
            : Ok(result);
    }

    [HttpPost("facebook")]
    public async Task<IActionResult> FacebookLogin([FromBody] ExternalAuthRequest request)
    {
        var result = await svc.FacebookLoginAsync(request.Token);
        return result is null
            ? Unauthorized(new { message = "Sikertelen Facebook bejelentkezés." })
            : Ok(result);
    }
}
