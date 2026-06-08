using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class PracticeQuestionService(IPracticeQuestionRepository repo) : IPracticeQuestionService
{
    public async Task<IReadOnlyList<PracticeQuestionResponse>> GetAllAsync(int userId)
    {
        var questions = await repo.GetAllByUserAsync(userId);
        return questions.Select(Map).ToList();
    }

    public async Task<PracticeQuestionResponse> CreateAsync(CreatePracticeQuestionRequest request, int userId)
    {
        var question = new PracticeQuestion
        {
            UserId = userId,
            Category = request.Category.Trim(),
            Question = request.Question.Trim(),
            Hint = request.Hint.Trim(),
            SampleAnswer = request.SampleAnswer.Trim()
        };
        await repo.AddAsync(question);
        return Map(question);
    }

    public async Task<PracticeQuestionResponse?> SetFeedbackAsync(int id, RatePracticeQuestionRequest request, int userId)
    {
        var question = await repo.GetByIdAsync(id, userId);
        if (question is null) return null;

        question.Feedback = request.Feedback;
        await repo.UpdateAsync(question);
        return Map(question);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    private static PracticeQuestionResponse Map(PracticeQuestion q) =>
        new(q.Id, q.Category, q.Question, q.Hint, q.SampleAnswer, q.Feedback);
}
