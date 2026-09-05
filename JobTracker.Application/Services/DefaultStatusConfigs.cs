using JobTracker.Domain.Entities;

namespace JobTracker.Application.Services;

public static class DefaultStatusConfigs
{
    public static JobStatusConfig[] For(int userId) =>
    [
        new JobStatusConfig
        {
            UserId = userId, Key = "Saved", Label = "Saved", Color = "#9b9b99", SortOrder = 0,
            Description = "Shortlisted, not sent out yet.", Outcome = StatusOutcomes.Open
        },
        new JobStatusConfig
        {
            UserId = userId, Key = "Applied", Label = "Applied", Color = "#5fb9fa", SortOrder = 1,
            Description = "Application sent, waiting for the company.", Outcome = StatusOutcomes.Open,
            CountsAsApplication = true, StaleAfterDays = 21
        },
        new JobStatusConfig
        {
            UserId = userId, Key = "Interview", Label = "Interview", Color = "#f59e0b", SortOrder = 2,
            Description = "An interview round is running.", Outcome = StatusOutcomes.Open,
            CountsAsApplication = true, CountsAsResponse = true, IsInterview = true, StaleAfterDays = 14
        },
        new JobStatusConfig
        {
            UserId = userId, Key = "Offer", Label = "Offer", Color = "#26ac00", SortOrder = 3,
            Description = "Offer received.", Outcome = StatusOutcomes.Success,
            CountsAsApplication = true, CountsAsResponse = true, IsTerminal = true
        },
        new JobStatusConfig
        {
            UserId = userId, Key = "Rejected", Label = "Rejected", Color = "#ef4444", SortOrder = 4,
            Description = "The company closed the process.", Outcome = StatusOutcomes.Rejected,
            CountsAsApplication = true, CountsAsResponse = true, IsTerminal = true
        }
    ];
}
