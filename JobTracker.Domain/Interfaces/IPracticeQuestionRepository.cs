namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IPracticeQuestionRepository : IRepository<PracticeQuestion>
{
    Task<IReadOnlyList<PracticeQuestion>> GetAllByUserAsync(int userId);
    Task<PracticeQuestion?> GetByIdAsync(int id, int userId);
    Task<IReadOnlyList<PracticeQuestion>> AddRangeAsync(IEnumerable<PracticeQuestion> questions);
    Task<bool> DeleteAsync(int id, int userId);
    Task RenameCategoryAsync(string oldName, string newName, int userId);
    Task ResetFeedbackAsync(int userId);
}
