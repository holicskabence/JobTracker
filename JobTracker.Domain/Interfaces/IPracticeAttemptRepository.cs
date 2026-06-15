namespace JobTracker.Domain.Interfaces;

using JobTracker.Domain.Entities;

public interface IPracticeAttemptRepository : IRepository<PracticeAttempt>
{
    Task<IReadOnlyList<PracticeAttempt>> GetAllByUserAsync(int userId);
    Task DeleteAllByUserAsync(int userId);
}
