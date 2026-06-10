using Google.Apis.Auth;
using JobTracker.Application.Interfaces;
using Microsoft.Extensions.Configuration;

namespace JobTracker.Infrastructure.Services;

public sealed class GoogleAuthService(IConfiguration config) : IGoogleAuthService
{
    public async Task<ExternalUserInfo?> ValidateAsync(string idToken)
    {
        try
        {
            var clientId = config["Authentication:Google:ClientId"];
            var settings = new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = string.IsNullOrWhiteSpace(clientId) ? null : [clientId]
            };

            var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
            return new ExternalUserInfo(payload.Subject, payload.Email, payload.GivenName ?? string.Empty, payload.FamilyName ?? string.Empty);
        }
        catch (InvalidJwtException)
        {
            return null;
        }
    }
}
