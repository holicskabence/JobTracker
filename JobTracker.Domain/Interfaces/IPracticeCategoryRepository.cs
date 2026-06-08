namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IPracticeCategoryRepository : IRepository<PracticeCategory>
{
    Task<IReadOnlyList<PracticeCategory>> GetAllByUserAsync(int userId);
    Task<PracticeCategory?> GetByNameAsync(string name, int userId);
    Task<PracticeCategory?> GetByIdAsync(int id, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
