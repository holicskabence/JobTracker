using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class PracticeQuestionRepository(JobTrackerDbContext ctx)
    : BaseRepository<PracticeQuestion>(ctx), IPracticeQuestionRepository
{
    public async Task<IReadOnlyList<PracticeQuestion>> GetAllByUserAsync(int userId) =>
        await Ctx.PracticeQuestions.Where(q => q.UserId == userId).ToListAsync();

    public async Task<PracticeQuestion?> GetByIdAsync(int id, int userId) =>
        await Ctx.PracticeQuestions.FirstOrDefaultAsync(q => q.Id == id && q.UserId == userId);

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var question = await GetByIdAsync(id, userId);
        if (question is null) return false;
        Ctx.PracticeQuestions.Remove(question);
        await Ctx.SaveChangesAsync();
        return true;
    }

    public async Task RenameCategoryAsync(string oldName, string newName, int userId)
    {
        await Ctx.PracticeQuestions
            .Where(q => q.UserId == userId && q.Category == oldName)
            .ExecuteUpdateAsync(s => s.SetProperty(q => q.Category, newName));
    }

    public async Task ResetFeedbackAsync(int userId)
    {
        await Ctx.PracticeQuestions
            .Where(q => q.UserId == userId)
            .ExecuteUpdateAsync(s => s.SetProperty(q => q.Feedback, (string?)null));
    }
}
