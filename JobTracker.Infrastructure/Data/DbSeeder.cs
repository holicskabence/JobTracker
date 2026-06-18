namespace JobTracker.Infrastructure.Data;

using JobTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

public static class DbSeeder
{
    public const string DemoEmail = "demo@jobtracker.app";

    public static void Seed(JobTrackerDbContext ctx)
    {
        var demoUserId = SeedDemoUser(ctx);
        SeedStatusConfigs(ctx, demoUserId);
        SeedEventTypes(ctx, demoUserId);
        SeedJobs(ctx, demoUserId);
        SeedCalendarEvents(ctx, demoUserId);
        SeedPlannerTasks(ctx, demoUserId);
        SeedDocuments(ctx, demoUserId);
        SeedPracticeCategories(ctx, demoUserId);
        SeedPracticeQuestions(ctx, demoUserId);
    }

    public static async Task ResetUserDataAsync(JobTrackerDbContext ctx, int userId)
    {
        ctx.JobStatusHistories.RemoveRange(ctx.JobStatusHistories.Where(x => x.UserId == userId));
        ctx.Jobs.RemoveRange(ctx.Jobs.Where(x => x.UserId == userId));
        ctx.CalendarEvents.RemoveRange(ctx.CalendarEvents.Where(x => x.UserId == userId));
        ctx.PlannerTasks.RemoveRange(ctx.PlannerTasks.Where(x => x.UserId == userId));
        ctx.UserDocuments.RemoveRange(ctx.UserDocuments.Where(x => x.UserId == userId));
        ctx.EventTypes.RemoveRange(ctx.EventTypes.Where(x => x.UserId == userId));
        ctx.JobStatusConfigs.RemoveRange(ctx.JobStatusConfigs.Where(x => x.UserId == userId));
        ctx.PracticeQuestions.RemoveRange(ctx.PracticeQuestions.Where(x => x.UserId == userId));
        ctx.PracticeCategories.RemoveRange(ctx.PracticeCategories.Where(x => x.UserId == userId));
        ctx.PracticeAttempts.RemoveRange(ctx.PracticeAttempts.Where(x => x.UserId == userId));
        await ctx.SaveChangesAsync();

        ctx.JobStatusConfigs.AddRange(BuildStatusConfigs(userId));
        ctx.EventTypes.AddRange(BuildEventTypes(userId));
        var jobs = BuildJobs(userId);
        ctx.Jobs.AddRange(jobs);
        ctx.CalendarEvents.AddRange(BuildCalendarEvents(userId));
        ctx.PlannerTasks.AddRange(BuildPlannerTasks(userId));
        ctx.UserDocuments.AddRange(BuildDocuments(userId));
        ctx.PracticeCategories.AddRange(BuildPracticeCategories(userId));
        ctx.PracticeQuestions.AddRange(BuildPracticeQuestions(userId));
        await ctx.SaveChangesAsync();

        ctx.JobStatusHistories.AddRange(BuildInitialStatusHistory(userId, jobs));
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

    private static void SeedPracticeCategories(JobTrackerDbContext ctx, int userId)
    {
        if (ctx.PracticeCategories.Any(c => c.UserId == userId)) return;
        ctx.PracticeCategories.AddRange(BuildPracticeCategories(userId));
        ctx.SaveChanges();
    }

    private static int SeedDemoUser(JobTrackerDbContext ctx)
    {
        var existing = ctx.Users.FirstOrDefault(u => u.Email == DemoEmail);
        if (existing is not null) return existing.Id;

        var user = new AppUser
        {
            FirstName = "John",
            LastName = "Doe",
            Position = "Fullstack Developer",
            Email = DemoEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@1234"),
            Phone = "+1 555 123 4567",
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
        var jobs = BuildJobs(userId);
        ctx.Jobs.AddRange(jobs);
        ctx.SaveChanges();

        ctx.JobStatusHistories.AddRange(BuildInitialStatusHistory(userId, jobs));
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

    private static void SeedPracticeQuestions(JobTrackerDbContext ctx, int userId)
    {
        if (ctx.PracticeQuestions.Any(q => q.UserId == userId)) return;
        ctx.PracticeQuestions.AddRange(BuildPracticeQuestions(userId));
        ctx.SaveChanges();
    }

    private static JobStatusConfig[] BuildStatusConfigs(int userId) =>
    [
        new JobStatusConfig { UserId = userId, Key = "Mentett", Label = "Mentett", Color = "#9b9b99", SortOrder = 0, ShowInKanban = true },
        new JobStatusConfig { UserId = userId, Key = "Beadva", Label = "Beadva", Color = "#5fb9fa", SortOrder = 1, ShowInKanban = true },
        new JobStatusConfig { UserId = userId, Key = "Visszahivas", Label = "Visszahívás", Color = "#f59e0b", SortOrder = 2, ShowInKanban = true },
        new JobStatusConfig { UserId = userId, Key = "Ajanlat", Label = "Ajánlat", Color = "#26ac00", SortOrder = 3, ShowInKanban = true },
        new JobStatusConfig { UserId = userId, Key = "Elutasitva", Label = "Elutasítva", Color = "#ef4444", SortOrder = 4, ShowInKanban = true }
    ];

    private static EventType[] BuildEventTypes(int userId) =>
    [
        new EventType { Name = "HR Megkeresés", UserId = userId },
        new EventType { Name = "Technikai Interjú", UserId = userId },
        new EventType { Name = "Rendszertervezés", UserId = userId },
        new EventType { Name = "Tesztfeladat", UserId = userId },
        new EventType { Name = "Ajánlat egyeztetés", UserId = userId }
    ];

    private static PracticeCategory[] BuildPracticeCategories(int userId) =>
    [
        new PracticeCategory { UserId = userId, Name = "Technikai", Color = "#26ac00" },
        new PracticeCategory { UserId = userId, Name = "HR", Color = "#f59e0b" },
        new PracticeCategory { UserId = userId, Name = "Rendszertervezés", Color = "#8b5cf6" }
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

    private static JobStatusHistory[] BuildInitialStatusHistory(int userId, Job[] jobs) =>
        jobs
            .Select(j => new JobStatusHistory
            {
                JobId = j.Id,
                UserId = userId,
                Status = j.Status,
                ChangedAt = DateOnly.TryParse(j.Date, out var date)
                    ? date.ToDateTime(TimeOnly.MinValue)
                    : DateTime.UtcNow
            })
            .ToArray();

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
        new UserDocument { UserId = userId, Name = "Doe_John_Frontend_CV_2026_HU.pdf", Type = "Önéletrajz", Updated = "2026-05-20", Version = "v2.4" },
        new UserDocument { UserId = userId, Name = "Doe_John_Senior_Developer_EN.pdf", Type = "Önéletrajz", Updated = "2026-06-01", Version = "v3.0" },
        new UserDocument { UserId = userId, Name = "Standard_Motivacios_Level_HUN.docx", Type = "Kísérőlevél", Updated = "2026-04-10", Version = "v1.1" }
    ];

    private static PracticeQuestion[] BuildPracticeQuestions(int userId) =>
    [
        new PracticeQuestion
        {
            UserId = userId,
            Category = "Technikai",
            Question = "Hogyan működik a React/Angular Virtual DOM / Change Detection és miért nyújt jobb teljesítményt?",
            Hint = "Angularban: zone.js, OnPush stratégia, signals. Általánosan: diffing algoritmus, batch update.",
            SampleAnswer = "Az Angular alapból zone.js segítségével figyeli az aszinkron eseményeket és indít change detection ciklust. Az OnPush stratégiával csak akkor fut le, ha az Input-ok referenciája változik, ami drasztikusan csökkenti a felesleges ciklusokat. Az újabb Angular Signals rendszerben a reaktivitás teljesen granulárissá válik: csak a signal-t olvasó kifejezések frissülnek. Ez hasonló a React Virtual DOM diffing megközelítéséhez, ahol a közvetlen DOM műveletek helyett memóriában számoljuk ki a minimálisan szükséges változtatásokat."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = "Technikai",
            Question = "Mi a különbség a state management megoldások között? Mikor érdemes NgRx-et, Signals-t vagy Service-t használni?",
            Hint = "Globális vs. lokális állapot, felesleges újrarenderelések, egyszerűség vs. skálázhatóság.",
            SampleAnswer = "Egyszerű, lokális állapothoz elegendő egy Component Signal. Megosztott állapothoz kis-közepes alkalmazásban egy Injectable Service + Signal tökéletes, mivel kevés boilerplate-tel biztosít reaktív szinkronizációt. NGRx-re csak igazán komplex, sok akciót és side-effectet igénylő alkalmazásoknál van szükség, ahol a Redux DevTools és a time-travel debugging értéket ad. A kulcs: ne vezess be komplexitást, amíg a probléma nem igényli."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = "HR",
            Question = "Mesélj el egy helyzetet, amikor nézeteltérésed volt egy fejlesztőtársaddal. Hogyan oldottad meg?",
            Hint = "Használd a STAR módszert. Fókuszálj az empátiára, az adatokon alapuló érvelésre és a kompromisszumra.",
            SampleAnswer = "Egy projektben a PM azonnali kiadást kért egy animált funkcióhoz, ami szerintem rontotta az akadálymentesítést. Ahelyett, hogy konfrontálódtam volna, gyors Lighthouse-tesztet csináltam mindkét verzióhoz és megmutattam a számadatokat. Felajánlottam egy CSS-alapú átmenetet, ami vizuálisan szép volt, de nem terhelte a processzort. A PM elfogadta, a funkció időben és minőségben jelent meg. A tanulság: az adatokkal alátámasztott javaslat sokkal meggyőzőbb a konfrontációnál."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = "Rendszertervezés",
            Question = "Hogyan terveznél meg egy képekkel teli közösségi feedet minimális betöltési idővel?",
            Hint = "Lazy loading, CDN, WebP/AVIF formátumok, Infinite scroll, lista-virtualizáció.",
            SampleAnswer = "Több rétegű megközelítést alkalmaznék. Infrastrukturálisan: CDN (pl. Cloudflare) a képek kiszolgálásához, modern formátumokban (WebP/AVIF) és reszponzív méretekben (srcset). Frontenden: Intersection Observer alapú Lazy Loading, hogy csak a látható képek töltődjenek be. A felhasználói élményhez LQIP (Low Quality Image Placeholder) blur-t mutatnék betöltés alatt. A lista-teljesítményhez virtualizált scrollt (CDK Virtual Scroll Angularban) alkalmaznék, hogy egyszerre csak 20-30 DOM elem létezzen, függetlenül az adatok számától."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = "HR",
            Question = "Hol látod magad 5 év múlva szakmailag, és hogyan támogatja ezt a pozíció?",
            Hint = "Mutass elhivatottságot a folyamatos tanulás és az esetleges Tech Lead / mentori szerepek iránt.",
            SampleAnswer = "Szeretném elmélyíteni a tudásom a modern frontend architektúrák és a teljesítmény-optimalizáció terén, de a célom az is, hogy aktív mentorként és technológiai döntéshozóként (Tech Lead) segítsem a csapatot. Ez a pozíció a komplex, skálázódó termékkel kiváló lehetőséget ad mélyebb technológiai kihívások leküzdésére, miközben a növekvő fejlesztői csapat teret enged a vezetői képességeim fejlesztéséhez is."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = "Technikai",
            Question = "Magyarázd el a CSS specificitást és mikor okozhat problémát egy nagy alkalmazásban.",
            Hint = "Inline > ID > Class > Element. CSS Modules, BEM, scoped styles mint megoldások.",
            SampleAnswer = "A CSS specificitás határozza meg, melyik stílusszabály \"nyeri\" az ütközést: inline style (1000) > ID (100) > Class/Pseudo-class/Attribute (10) > Element (1). Nagy alkalmazásban ez \"specificity war\"-hoz vezet, ahol fejlesztők egyre magasabb specificitású szelektorokat írnak a felülíráshoz, ami karbantartási rémálomhoz vezet. Megoldások: BEM névadási konvenció (a class alapú hierarchia olvasható marad), CSS Modules vagy Angular Scoped Styles (komponent-szintű izoláció), vagy utility-first CSS mint Tailwind, ahol az összes osztály 10-es specificitású."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = "Rendszertervezés",
            Question = "Tervezz meg egy valós idejű értesítési rendszert (pl. chat alkalmazáshoz).",
            Hint = "WebSocket vs. SSE vs. Long Polling. Reconnection logika, message queue, scale-out.",
            SampleAnswer = "Valós idejű, kétirányú kommunikációhoz WebSocket a legjobb. Az architektúra: frontend WebSocket kapcsolat egy Gateway szerverre (pl. Socket.io/SignalR), amely Redis Pub/Sub-on keresztül kommunikál a háttérszolgáltatásokkal. Ez lehetővé teszi a horizontális skálázást, mivel minden Gateway-példány feliratkozik a releváns csatornákra. Fontosak még: automatikus reconnection exponenciális backoff-fal, üzenet-sorrend garantálása (sequence number), offline üzenetek tárolása Message Queue-ban (pl. RabbitMQ) és a kapcsolat állapotának kijelzése a UI-on."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = "Technikai",
            Question = "Mi az a TypeScript Generic és mikor érdemes használni?",
            Hint = "Típusbiztonság kódismétlés nélkül. Constraints, default types, conditional types.",
            SampleAnswer = "A Generic egy típusparaméter, amely lehetővé teszi, hogy egy függvény vagy osztály különböző típusokkal működjön anélkül, hogy elveszítené a típusbiztonságot. Pl. egy `function identity<T>(arg: T): T` bármely típussal hívható és a visszatérési értéke is pontosan az a típus lesz. Érdemes használni: generikus adatstruktúráknál (Repository<T>), API wrapper-eknél (ApiResponse<T>), hook-oknál és utility típusoknál. Constraint-ekkel (`<T extends object>`) tovább szűkíthetjük a megengedett típusokat."
        }
    ];
}
