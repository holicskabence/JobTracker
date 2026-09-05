using JobTracker.Domain.Entities;

namespace JobTracker.Application.Services;

public static class DefaultJobSources
{
    public static JobSource[] For(int userId) =>
    [
        new JobSource { UserId = userId, Name = "LinkedIn", MatchPattern = "linkedin." },
        new JobSource { UserId = userId, Name = "Profession", MatchPattern = "profession.hu" },
        new JobSource { UserId = userId, Name = "Indeed", MatchPattern = "indeed." },
        new JobSource { UserId = userId, Name = "Glassdoor", MatchPattern = "glassdoor." },
        new JobSource { UserId = userId, Name = "CVonline", MatchPattern = "cvonline." },
        new JobSource { UserId = userId, Name = "Workania", MatchPattern = "workania." },
        new JobSource { UserId = userId, Name = "Company website", MatchPattern = null },
        new JobSource { UserId = userId, Name = "Referral", MatchPattern = null }
    ];
}
