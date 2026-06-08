using JobTracker.Application.DTOs;

namespace JobTracker.Application.Interfaces;

public interface IStatsService
{
    Task<IReadOnlyList<MonthlyStatsResponse>> GetMonthlyAsync(int userId);
}
