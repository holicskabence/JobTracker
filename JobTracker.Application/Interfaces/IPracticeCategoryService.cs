using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IPracticeCategoryService
{
    Task<IReadOnlyList<PracticeCategoryResponse>> GetAllAsync(int userId);
    Task<PracticeCategoryResponse?> CreateAsync(CreatePracticeCategoryRequest request, int userId);
    Task<PracticeCategoryResponse?> UpdateAsync(int id, UpdatePracticeCategoryRequest request, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
