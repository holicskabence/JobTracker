namespace JobTracker.Application.Interfaces;

public interface IDemoResetService
{
    Task ResetIfDemoAccountAsync(int userId, string email);
}
