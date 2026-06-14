using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class PracticeCategoryService(IPracticeCategoryRepository repo, IPracticeQuestionRepository questionRepo) : IPracticeCategoryService
{
    public async Task<IReadOnlyList<PracticeCategoryResponse>> GetAllAsync(int userId)
    {
        var categories = await repo.GetAllByUserAsync(userId);
        return categories.Select(Map).ToList();
    }

    public async Task<PracticeCategoryResponse?> CreateAsync(CreatePracticeCategoryRequest request, int userId)
    {
        var name = request.Name.Trim();
        if (await repo.GetByNameAsync(name, userId) is not null) return null;

        var category = new PracticeCategory { UserId = userId, Name = name, Color = request.Color };
        await repo.AddAsync(category);
        return Map(category);
    }

    public async Task<PracticeCategoryResponse?> UpdateAsync(int id, UpdatePracticeCategoryRequest request, int userId)
    {
        var category = await repo.GetByIdAsync(id, userId);
        if (category is null) return null;

        var oldName = category.Name;
        var newName = request.Name.Trim();
        category.Name = newName;
        category.Color = request.Color;
        await repo.UpdateAsync(category);

        if (oldName != newName)
            await questionRepo.RenameCategoryAsync(oldName, newName, userId);

        return Map(category);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    private static PracticeCategoryResponse Map(PracticeCategory c) => new(c.Id, c.Name, c.Color);
}
