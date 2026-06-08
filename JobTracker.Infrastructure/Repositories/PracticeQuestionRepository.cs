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
}
