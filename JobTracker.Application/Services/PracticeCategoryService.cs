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
        return Sort(categories).Select(Map).ToList();
    }

    public async Task<PracticeCategoryResponse?> CreateAsync(CreatePracticeCategoryRequest request, int userId)
    {
        var name = request.Name.Trim();
        if (await repo.GetByNameAsync(name, userId) is not null) return null;

        var all = await repo.GetAllByUserAsync(userId);
        var category = new PracticeCategory
        {
            UserId = userId,
            Name = name,
            Color = request.Color,
            SortOrder = all.Count > 0 ? all.Max(c => c.SortOrder) + 1 : 0
        };
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
        category.IsHidden = request.IsHidden;
        await repo.UpdateAsync(category);

        if (oldName != newName)
            await questionRepo.RenameCategoryAsync(oldName, newName, userId);

        return Map(category);
    }

    public async Task<bool> DeleteAsync(int id, int userId) => await repo.DeleteAsync(id, userId);

    public async Task<IReadOnlyList<PracticeCategoryResponse>> ReorderAsync(IEnumerable<ReorderPracticeCategoryItem> items, int userId)
    {
        var all = await repo.GetAllByUserAsync(userId);
        foreach (var item in items)
        {
            var category = all.FirstOrDefault(c => c.Id == item.Id);
            if (category is null) continue;
            category.SortOrder = item.SortOrder;
            await repo.UpdateAsync(category);
        }
        var updated = await repo.GetAllByUserAsync(userId);
        return Sort(updated).Select(Map).ToList();
    }

    private static IEnumerable<PracticeCategory> Sort(IEnumerable<PracticeCategory> categories) =>
        categories.OrderBy(c => c.SortOrder).ThenBy(c => c.Id);

    private static PracticeCategoryResponse Map(PracticeCategory c) => new(c.Id, c.Name, c.Color, c.SortOrder, c.IsHidden);
}
