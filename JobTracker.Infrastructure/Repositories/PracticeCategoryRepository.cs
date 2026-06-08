using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;
using JobTracker.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Repositories;

public sealed class PracticeCategoryRepository(JobTrackerDbContext ctx)
    : BaseRepository<PracticeCategory>(ctx), IPracticeCategoryRepository
{
    public async Task<IReadOnlyList<PracticeCategory>> GetAllByUserAsync(int userId) =>
        await Ctx.PracticeCategories.Where(c => c.UserId == userId).ToListAsync();

    public async Task<PracticeCategory?> GetByNameAsync(string name, int userId) =>
        await Ctx.PracticeCategories.FirstOrDefaultAsync(c => c.Name == name && c.UserId == userId);

    public async Task<PracticeCategory?> GetByIdAsync(int id, int userId) =>
        await Ctx.PracticeCategories.FirstOrDefaultAsync(c => c.Id == id && c.UserId == userId);

    public async Task<bool> DeleteAsync(int id, int userId)
    {
        var category = await GetByIdAsync(id, userId);
        if (category is null) return false;
        Ctx.PracticeCategories.Remove(category);
        await Ctx.SaveChangesAsync();
        return true;
    }
}
