using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class PracticeAttemptService(IPracticeAttemptRepository repo, IPracticeQuestionRepository questionRepo) : IPracticeAttemptService
{
    public async Task<IReadOnlyList<PracticeAttemptResponse>> GetAllAsync(int userId)
    {
        var attempts = await repo.GetAllByUserAsync(userId);
        return attempts.Select(Map).ToList();
    }

    public async Task<PracticeAttemptResponse?> CreateAsync(CreatePracticeAttemptRequest request, int userId)
    {
        var question = await questionRepo.GetByIdAsync(request.PracticeQuestionId, userId);
        if (question is null) return null;

        var attempt = new PracticeAttempt
        {
            UserId = userId,
            PracticeQuestionId = question.Id,
            Category = question.Category,
            Question = question.Question,
            UserAnswer = request.UserAnswer.Trim(),
            Feedback = request.Feedback,
            CreatedAt = DateTime.UtcNow
        };
        await repo.AddAsync(attempt);
        return Map(attempt);
    }

    private static PracticeAttemptResponse Map(PracticeAttempt a) =>
        new(a.Id, a.PracticeQuestionId, a.Category, a.Question, a.UserAnswer, a.Feedback, a.CreatedAt);
}
