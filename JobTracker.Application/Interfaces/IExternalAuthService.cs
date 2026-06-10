namespace JobTracker.Application.Interfaces;

public record ExternalUserInfo(string ProviderId, string Email, string FirstName, string LastName);

public interface IGoogleAuthService
{
    Task<ExternalUserInfo?> ValidateAsync(string idToken);
}

public interface IFacebookAuthService
{
    Task<ExternalUserInfo?> ValidateAsync(string accessToken);
}
