namespace JobTracker.Infrastructure.Data;

using JobTracker.Domain.Entities;

public static class DbSeeder
{
    public static void Seed(JobTrackerDbContext ctx)
    {
        SeedStatusConfigs(ctx);
        SeedEventTypes(ctx);
        SeedDemoUser(ctx);
        SeedJobs(ctx);
        SeedCalendarEvents(ctx);
        SeedPlannerTasks(ctx);
        SeedDocuments(ctx);
    }

    private static void SeedStatusConfigs(JobTrackerDbContext ctx)
    {
        if (ctx.JobStatusConfigs.Any()) return;
        ctx.JobStatusConfigs.AddRange(
            new JobStatusConfig { Key = "Mentett", Label = "Mentett", Color = "#9b9b99", SortOrder = 0 },
            new JobStatusConfig { Key = "Beadva", Label = "Beadva", Color = "#5fb9fa", SortOrder = 1 },
            new JobStatusConfig { Key = "Visszahivas", Label = "Visszahívás", Color = "#f59e0b", SortOrder = 2 },
            new JobStatusConfig { Key = "Ajanlat", Label = "Ajánlat", Color = "#26ac00", SortOrder = 3 },
            new JobStatusConfig { Key = "Elutasitva", Label = "Elutasítva", Color = "#ef4444", SortOrder = 4 }
        );
        ctx.SaveChanges();
    }

    private static void SeedEventTypes(JobTrackerDbContext ctx)
    {
        if (ctx.EventTypes.Any()) return;
        ctx.EventTypes.AddRange(
            new EventType { Name = "HR Megkeresés" },
            new EventType { Name = "Technikai Interjú" },
            new EventType { Name = "Rendszertervezés" },
            new EventType { Name = "Tesztfeladat" },
            new EventType { Name = "Ajánlat egyeztetés" }
        );
        ctx.SaveChanges();
    }

    private static void SeedDemoUser(JobTrackerDbContext ctx)
    {
        if (ctx.Users.Any()) return;
        ctx.Users.Add(new AppUser
        {
            FirstName = "Bence",
            LastName = "Holicska",
            Position = "Fullstack Developer",
            Email = "benceholicska@gmail.com",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@1234"),
            Phone = "+36 30 123 4567",
            Goal = 30,
            JoinDate = "2026. március"
        });
        ctx.SaveChanges();
    }

    private static void SeedJobs(JobTrackerDbContext ctx)
    {
        if (ctx.Jobs.Any()) return;
        ctx.Jobs.AddRange(
            new Job { Company = "Tech Corp", Position = "Frontend fejlesztő", Date = "2026-05-10", Status = "Beadva" },
            new Job { Company = "StartupXY", Position = "Full-stack fejlesztő", Date = "2026-05-15", Status = "Visszahivas" },
            new Job { Company = "BigBank Zrt.", Position = "Angular fejlesztő", Date = "2026-05-20", Status = "Elutasitva" },
            new Job { Company = "DigitalHub", Position = "Senior fejlesztő", Date = "2026-05-28", Status = "Beadva" },
            new Job { Company = "InnoSoft", Position = "UI fejlesztő", Date = "2026-06-01", Status = "Ajanlat" },
            new Job { Company = "Google", Position = "Software Engineer", Date = "2026-06-03", Status = "Visszahivas", Link = "https://careers.google.com" },
            new Job { Company = "Stripe", Position = "Frontend Developer", Date = "2026-06-04", Status = "Mentett" }
        );
        ctx.SaveChanges();
    }

    private static void SeedCalendarEvents(JobTrackerDbContext ctx)
    {
        if (ctx.CalendarEvents.Any()) return;
        ctx.CalendarEvents.AddRange(
            new CalendarEvent { Type = "Technikai Interjú", Company = "Google", Date = "2026-06-12", Time = "14:00", Notes = "Google Meet link a naptárban. Rendszertervezés és React mélyvíz." },
            new CalendarEvent { Type = "HR Megkeresés", Company = "Stripe", Date = "2026-06-18", Time = "10:30", Notes = "Ismerkedő beszélgetés a toborzóval, bérigény tisztázása." }
        );
        ctx.SaveChanges();
    }

    private static void SeedPlannerTasks(JobTrackerDbContext ctx)
    {
        if (ctx.PlannerTasks.Any()) return;
        ctx.PlannerTasks.AddRange(
            new PlannerTask { Text = "Leetcode gyakorlás (szekvenciális tömbök)", Completed = true, SortOrder = 1 },
            new PlannerTask { Text = "Google portfólió-prezentáció finomítása", Completed = false, SortOrder = 2 },
            new PlannerTask { Text = "Köszönőlevél küldése a Spotify interjú után", Completed = true, SortOrder = 3 },
            new PlannerTask { Text = "LinkedIn profil frissítése a legutóbbi projekttel", Completed = false, SortOrder = 4 }
        );
        ctx.SaveChanges();
    }

    private static void SeedDocuments(JobTrackerDbContext ctx)
    {
        if (ctx.UserDocuments.Any()) return;
        ctx.UserDocuments.AddRange(
            new UserDocument { Name = "Kovacs_Bence_Frontend_CV_2026_HU.pdf", Type = "Önéletrajz", Updated = "2026-05-20", Version = "v2.4" },
            new UserDocument { Name = "Kovacs_Bence_Senior_Developer_EN.pdf", Type = "Önéletrajz", Updated = "2026-06-01", Version = "v3.0" },
            new UserDocument { Name = "Standard_Motivacios_Level_HUN.docx", Type = "Kísérőlevél", Updated = "2026-04-10", Version = "v1.1" }
        );
        ctx.SaveChanges();
    }
}
