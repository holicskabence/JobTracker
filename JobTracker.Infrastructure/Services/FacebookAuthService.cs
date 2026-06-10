using System.Net.Http.Json;
using System.Text.Json.Serialization;
using JobTracker.Application.Interfaces;

namespace JobTracker.Infrastructure.Services;

public sealed class FacebookAuthService(IHttpClientFactory httpClientFactory) : IFacebookAuthService
{
    public async Task<ExternalUserInfo?> ValidateAsync(string accessToken)
    {
        var client = httpClientFactory.CreateClient();
        var url = $"https://graph.facebook.com/v19.0/me?fields=id,first_name,last_name,email&access_token={Uri.EscapeDataString(accessToken)}";

        var response = await client.GetAsync(url);
        if (!response.IsSuccessStatusCode) return null;

        var profile = await response.Content.ReadFromJsonAsync<FacebookProfile>();
        if (profile is null || string.IsNullOrWhiteSpace(profile.Email)) return null;

        return new ExternalUserInfo(profile.Id, profile.Email, profile.FirstName ?? string.Empty, profile.LastName ?? string.Empty);
    }

    private sealed class FacebookProfile
    {
        [JsonPropertyName("id")]
        public string Id { get; set; } = string.Empty;

        [JsonPropertyName("first_name")]
        public string? FirstName { get; set; }

        [JsonPropertyName("last_name")]
        public string? LastName { get; set; }

        [JsonPropertyName("email")]
        public string? Email { get; set; }
    }
}
