using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IPracticeQuestionService
{
    Task<IReadOnlyList<PracticeQuestionResponse>> GetAllAsync(int userId);
    Task<PracticeQuestionResponse> CreateAsync(CreatePracticeQuestionRequest request, int userId);
    Task<IReadOnlyList<PracticeQuestionResponse>> CreateManyAsync(IReadOnlyList<CreatePracticeQuestionRequest> requests, int userId);
    Task<PracticeQuestionResponse?> UpdateAsync(int id, UpdatePracticeQuestionRequest request, int userId);
    Task<PracticeQuestionResponse?> SetFeedbackAsync(int id, RatePracticeQuestionRequest request, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<AiEvaluateResponse?> EvaluateAnswerAsync(int questionId, int userId, string userAnswer, string? customPrompt);
    Task<IReadOnlyList<PracticeQuestionResponse>> ResetStatisticsAsync(int userId);
}
