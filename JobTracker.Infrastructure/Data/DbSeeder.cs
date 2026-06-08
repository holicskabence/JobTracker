namespace JobTracker.Infrastructure.Data;

using JobTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

public static class DbSeeder
{
    public const string DemoEmail = "benceholicska@gmail.com";

    public static void Seed(JobTrackerDbContext ctx)
    {
        var demoUserId = SeedDemoUser(ctx);
        SeedStatusConfigs(ctx, demoUserId);
        SeedEventTypes(ctx, demoUserId);
        SeedJobs(ctx, demoUserId);
        SeedCalendarEvents(ctx, demoUserId);
        SeedPlannerTasks(ctx, demoUserId);
        SeedDocuments(ctx, demoUserId);
    }

    public static async Task ResetUserDataAsync(JobTrackerDbContext ctx, int userId)
    {
        ctx.Jobs.RemoveRange(ctx.Jobs.Where(x => x.UserId == userId));
        ctx.CalendarEvents.RemoveRange(ctx.CalendarEvents.Where(x => x.UserId == userId));
        ctx.PlannerTasks.RemoveRange(ctx.PlannerTasks.Where(x => x.UserId == userId));
        ctx.UserDocuments.RemoveRange(ctx.UserDocuments.Where(x => x.UserId == userId));
        ctx.EventTypes.RemoveRange(ctx.EventTypes.Where(x => x.UserId == userId));
        ctx.JobStatusConfigs.RemoveRange(ctx.JobStatusConfigs.Where(x => x.UserId == userId));
        await ctx.SaveChangesAsync();

        ctx.JobStatusConfigs.AddRange(BuildStatusConfigs(userId));
        ctx.EventTypes.AddRange(BuildEventTypes(userId));
        ctx.Jobs.AddRange(BuildJobs(userId));
        ctx.CalendarEvents.AddRange(BuildCalendarEvents(userId));
        ctx.PlannerTasks.AddRange(BuildPlannerTasks(userId));
        ctx.UserDocuments.AddRange(BuildDocuments(userId));
        await ctx.SaveChangesAsync();
    }

    private static void SeedStatusConfigs(JobTrackerDbContext ctx, int userId)
    {
        if (ctx.JobStatusConfigs.Any(c => c.UserId == userId)) return;
        ctx.JobStatusConfigs.AddRange(BuildStatusConfigs(userId));
        ctx.SaveChanges();
    }

    private static void SeedEventTypes(JobTrackerDbContext ctx, int userId)
    {
        if (ctx.EventTypes.Any(t => t.UserId == userId)) return;
        ctx.EventTypes.AddRange(BuildEventTypes(userId));
        ctx.SaveChanges();
    }

    private static int SeedDemoUser(JobTrackerDbContext ctx)
    {
        var existing = ctx.Users.FirstOrDefault(u => u.Email == DemoEmail);
        if (existing is not null) return existing.Id;

        var user = new AppUser
        {
            FirstName = "Bence",
            LastName = "Holicska",
            Position = "Fullstack Developer",
            Email = DemoEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@1234"),
            Phone = "+36 30 123 4567",
            Goal = 30,
            JoinDate = "2026. március"
        };
        ctx.Users.Add(user);
        ctx.SaveChanges();
        return user.Id;
    }

    private static void SeedJobs(JobTrackerDbContext ctx, int userId)
    {
        if (ctx.Jobs.Any(j => j.UserId == userId)) return;
        ctx.Jobs.AddRange(BuildJobs(userId));
        ctx.SaveChanges();
    }

    private static void SeedCalendarEvents(JobTrackerDbContext ctx, int userId)
    {
        if (ctx.CalendarEvents.Any(e => e.UserId == userId)) return;
        ctx.CalendarEvents.AddRange(BuildCalendarEvents(userId));
        ctx.SaveChanges();
    }

    private static void SeedPlannerTasks(JobTrackerDbContext ctx, int userId)
    {
        if (ctx.PlannerTasks.Any(t => t.UserId == userId)) return;
        ctx.PlannerTasks.AddRange(BuildPlannerTasks(userId));
        ctx.SaveChanges();
    }

    private static void SeedDocuments(JobTrackerDbContext ctx, int userId)
    {
        if (ctx.UserDocuments.Any(d => d.UserId == userId)) return;
        ctx.UserDocuments.AddRange(BuildDocuments(userId));
        ctx.SaveChanges();
    }

    private static JobStatusConfig[] BuildStatusConfigs(int userId) =>
    [
        new JobStatusConfig { UserId = userId, Key = "Mentett", Label = "Mentett", Color = "#9b9b99", SortOrder = 0 },
        new JobStatusConfig { UserId = userId, Key = "Beadva", Label = "Beadva", Color = "#5fb9fa", SortOrder = 1 },
        new JobStatusConfig { UserId = userId, Key = "Visszahivas", Label = "Visszahívás", Color = "#f59e0b", SortOrder = 2 },
        new JobStatusConfig { UserId = userId, Key = "Ajanlat", Label = "Ajánlat", Color = "#26ac00", SortOrder = 3 },
        new JobStatusConfig { UserId = userId, Key = "Elutasitva", Label = "Elutasítva", Color = "#ef4444", SortOrder = 4 }
    ];

    private static EventType[] BuildEventTypes(int userId) =>
    [
        new EventType { Name = "HR Megkeresés", UserId = userId },
        new EventType { Name = "Technikai Interjú", UserId = userId },
        new EventType { Name = "Rendszertervezés", UserId = userId },
        new EventType { Name = "Tesztfeladat", UserId = userId },
        new EventType { Name = "Ajánlat egyeztetés", UserId = userId }
    ];

    private static Job[] BuildJobs(int userId) =>
    [
        new Job { UserId = userId, Company = "Tech Corp", Position = "Frontend fejlesztő", Date = "2026-05-10", Status = "Beadva" },
        new Job { UserId = userId, Company = "StartupXY", Position = "Full-stack fejlesztő", Date = "2026-05-15", Status = "Visszahivas" },
        new Job { UserId = userId, Company = "BigBank Zrt.", Position = "Angular fejlesztő", Date = "2026-05-20", Status = "Elutasitva" },
        new Job { UserId = userId, Company = "DigitalHub", Position = "Senior fejlesztő", Date = "2026-05-28", Status = "Beadva" },
        new Job { UserId = userId, Company = "InnoSoft", Position = "UI fejlesztő", Date = "2026-06-01", Status = "Ajanlat" },
        new Job { UserId = userId, Company = "Google", Position = "Software Engineer", Date = "2026-06-03", Status = "Visszahivas", Link = "https://careers.google.com" },
        new Job { UserId = userId, Company = "Stripe", Position = "Frontend Developer", Date = "2026-06-04", Status = "Mentett" }
    ];

    private static CalendarEvent[] BuildCalendarEvents(int userId) =>
    [
        new CalendarEvent { UserId = userId, Type = "Technikai Interjú", Company = "Google", Date = "2026-06-12", Time = "14:00", Notes = "Google Meet link a naptárban. Rendszertervezés és React mélyvíz." },
        new CalendarEvent { UserId = userId, Type = "HR Megkeresés", Company = "Stripe", Date = "2026-06-18", Time = "10:30", Notes = "Ismerkedő beszélgetés a toborzóval, bérigény tisztázása." }
    ];

    private static PlannerTask[] BuildPlannerTasks(int userId) =>
    [
        new PlannerTask { UserId = userId, Text = "Leetcode gyakorlás (szekvenciális tömbök)", Completed = true, SortOrder = 1 },
        new PlannerTask { UserId = userId, Text = "Google portfólió-prezentáció finomítása", Completed = false, SortOrder = 2 },
        new PlannerTask { UserId = userId, Text = "Köszönőlevél küldése a Spotify interjú után", Completed = true, SortOrder = 3 },
        new PlannerTask { UserId = userId, Text = "LinkedIn profil frissítése a legutóbbi projekttel", Completed = false, SortOrder = 4 }
    ];

    private static UserDocument[] BuildDocuments(int userId) =>
    [
        new UserDocument { UserId = userId, Name = "Kovacs_Bence_Frontend_CV_2026_HU.pdf", Type = "Önéletrajz", Updated = "2026-05-20", Version = "v2.4" },
        new UserDocument { UserId = userId, Name = "Kovacs_Bence_Senior_Developer_EN.pdf", Type = "Önéletrajz", Updated = "2026-06-01", Version = "v3.0" },
        new UserDocument { UserId = userId, Name = "Standard_Motivacios_Level_HUN.docx", Type = "Kísérőlevél", Updated = "2026-04-10", Version = "v1.1" }
    ];
}
