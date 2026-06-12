using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IPracticeAttemptService
{
    Task<IReadOnlyList<PracticeAttemptResponse>> GetAllAsync(int userId);
    Task<PracticeAttemptResponse?> CreateAsync(CreatePracticeAttemptRequest request, int userId);
}
