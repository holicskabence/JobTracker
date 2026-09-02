namespace JobTracker.Infrastructure.Data;

using System.Globalization;
using JobTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

public static class DbSeeder
{
    public const string DemoEmail = "demo@jobtracker.app";

    private const string StatusSaved = "Saved";
    private const string StatusApplied = "Applied";
    private const string StatusInterview = "Interview";
    private const string StatusOffer = "Offer";
    private const string StatusRejected = "Rejected";

    private const string EventHrScreening = "HR Screening";
    private const string EventTechnicalInterview = "Technical Interview";
    private const string EventSystemDesign = "System Design";
    private const string EventTakeHomeTask = "Take-home Task";
    private const string EventOfferDiscussion = "Offer Discussion";

    private const string PracticeTechnical = "Technical";
    private const string PracticeHr = "HR";
    private const string PracticeSystemDesign = "System Design";

    private const string FeedbackCorrect = "correct";
    private const string FeedbackIncorrect = "incorrect";

    private sealed record JobSeed(
        string Company,
        string Position,
        int AppliedDaysAgo,
        (string Status, int Day)[] Timeline,
        string? Link = null);

    private sealed record AttemptSeed(int QuestionIndex, int DaysAgo, string Feedback, string Answer);

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

        var user = await ctx.Users.FirstOrDefaultAsync(u => u.Id == userId);
        if (user is not null) ApplyDemoProfile(user);

        ctx.JobStatusConfigs.AddRange(BuildStatusConfigs(userId));
        ctx.EventTypes.AddRange(BuildEventTypes(userId));
        var jobs = BuildJobs(userId);
        ctx.Jobs.AddRange(jobs);
        ctx.CalendarEvents.AddRange(BuildCalendarEvents(userId));
        ctx.PlannerTasks.AddRange(BuildPlannerTasks(userId));
        ctx.UserDocuments.AddRange(BuildDocuments(userId));
        ctx.PracticeCategories.AddRange(BuildPracticeCategories(userId));
        var questions = BuildPracticeQuestions(userId);
        ctx.PracticeQuestions.AddRange(questions);
        await ctx.SaveChangesAsync();

        var attempts = BuildPracticeAttempts(userId, questions);
        ctx.PracticeAttempts.AddRange(attempts);
        ApplyLatestFeedback(questions, attempts);
        ctx.JobStatusHistories.AddRange(BuildStatusHistory(userId, jobs));
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
            Email = DemoEmail,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Demo@1234")
        };
        ApplyDemoProfile(user);
        ctx.Users.Add(user);
        ctx.SaveChanges();
        return user.Id;
    }

    private static void ApplyDemoProfile(AppUser user)
    {
        user.FirstName = "John";
        user.LastName = "Doe";
        user.Position = "Full-stack Developer";
        user.Phone = "+1 555 123 4567";
        user.Goal = 60;
        user.JoinDate = Today().AddMonths(-6).ToString("MMMM yyyy", CultureInfo.InvariantCulture);
    }

    private static void SeedJobs(JobTrackerDbContext ctx, int userId)
    {
        if (ctx.Jobs.Any(j => j.UserId == userId)) return;
        var jobs = BuildJobs(userId);
        ctx.Jobs.AddRange(jobs);
        ctx.SaveChanges();

        ctx.JobStatusHistories.AddRange(BuildStatusHistory(userId, jobs));
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
        var questions = BuildPracticeQuestions(userId);
        ctx.PracticeQuestions.AddRange(questions);
        ctx.SaveChanges();

        var attempts = BuildPracticeAttempts(userId, questions);
        ctx.PracticeAttempts.AddRange(attempts);
        ApplyLatestFeedback(questions, attempts);
        ctx.SaveChanges();
    }

    private static DateOnly Today() => DateOnly.FromDateTime(DateTime.UtcNow);

    private static string DateAt(int daysFromToday) =>
        Today().AddDays(daysFromToday).ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    private static DateTime MomentAt(int daysFromToday, int hour) =>
        Today().AddDays(daysFromToday).ToDateTime(new TimeOnly(hour, 0));

    private static JobStatusConfig[] BuildStatusConfigs(int userId) =>
    [
        new JobStatusConfig { UserId = userId, Key = StatusSaved, Label = "Saved", Color = "#9b9b99", SortOrder = 0, ShowInKanban = true },
        new JobStatusConfig { UserId = userId, Key = StatusApplied, Label = "Applied", Color = "#5fb9fa", SortOrder = 1, ShowInKanban = true, IsActive = true },
        new JobStatusConfig { UserId = userId, Key = StatusInterview, Label = "Interview", Color = "#f59e0b", SortOrder = 2, ShowInKanban = true, IsActive = true, IsInterview = true },
        new JobStatusConfig { UserId = userId, Key = StatusOffer, Label = "Offer", Color = "#26ac00", SortOrder = 3, ShowInKanban = true, StatsCategory = "Success" },
        new JobStatusConfig { UserId = userId, Key = StatusRejected, Label = "Rejected", Color = "#ef4444", SortOrder = 4, ShowInKanban = true, StatsCategory = "Rejected" }
    ];

    private static EventType[] BuildEventTypes(int userId) =>
    [
        new EventType { UserId = userId, Name = EventHrScreening, Color = "#f59e0b" },
        new EventType { UserId = userId, Name = EventTechnicalInterview, Color = "#5fb9fa" },
        new EventType { UserId = userId, Name = EventSystemDesign, Color = "#8b5cf6" },
        new EventType { UserId = userId, Name = EventTakeHomeTask, Color = "#f97316" },
        new EventType { UserId = userId, Name = EventOfferDiscussion, Color = "#26ac00" }
    ];

    private static PracticeCategory[] BuildPracticeCategories(int userId) =>
    [
        new PracticeCategory { UserId = userId, Name = PracticeTechnical, Color = "#26ac00" },
        new PracticeCategory { UserId = userId, Name = PracticeHr, Color = "#f59e0b" },
        new PracticeCategory { UserId = userId, Name = PracticeSystemDesign, Color = "#8b5cf6" }
    ];

    private static readonly JobSeed[] JobSeeds =
    [
        new("Northwind Labs", "Frontend Developer", 172, [(StatusApplied, 0), (StatusRejected, 11)]),
        new("Arcadia Systems", "Angular Developer", 168, [(StatusSaved, 0), (StatusApplied, 3), (StatusRejected, 19)]),
        new("Bluepeak Digital", "Full-stack Developer", 165, [(StatusApplied, 0), (StatusInterview, 9), (StatusRejected, 24)]),
        new("Cobalt Interactive", "UI Engineer", 159, [(StatusApplied, 0), (StatusRejected, 7)]),
        new("Driftwood Software", "React Developer", 154, [(StatusApplied, 0), (StatusRejected, 16)]),
        new("Everline Analytics", "Frontend Engineer", 148, [(StatusApplied, 0), (StatusInterview, 12), (StatusRejected, 31)]),
        new("Fernway Technologies", "Software Engineer", 143, [(StatusApplied, 0), (StatusRejected, 9)]),
        new("Granite Bay Media", "Web Developer", 137, [(StatusSaved, 0), (StatusApplied, 4), (StatusRejected, 18)]),
        new("Ironvale Studio", "Frontend Developer", 131, [(StatusApplied, 0), (StatusRejected, 21)]),
        new("Junipergrove Health", "Angular Developer", 126, [(StatusApplied, 0), (StatusInterview, 10), (StatusRejected, 26)]),
        new("Kestrel Robotics", "Software Engineer", 120, [(StatusApplied, 0), (StatusRejected, 13)]),
        new("Lakeshore Fintech", "Full-stack Developer", 114, [(StatusApplied, 0), (StatusRejected, 8)]),
        new("Meridian Nine", "Senior Frontend Developer", 109, [(StatusApplied, 0), (StatusInterview, 11), (StatusRejected, 29)]),
        new("Northgate Retail Group", "Frontend Developer", 103, [(StatusApplied, 0), (StatusRejected, 15)]),
        new("Orchid Cloud", "TypeScript Developer", 97, [(StatusApplied, 0), (StatusRejected, 10)]),
        new("Pinegrove Software", "Full-stack Engineer", 92, [(StatusSaved, 0), (StatusApplied, 2), (StatusRejected, 23)]),
        new("Quartzline Data", "Frontend Engineer", 86, [(StatusApplied, 0), (StatusInterview, 8), (StatusRejected, 25)]),
        new("Riverbend Commerce", "React Developer", 79, [(StatusApplied, 0), (StatusRejected, 12)]),
        new("Silverpine Labs", "Software Engineer", 71, [(StatusApplied, 0), (StatusRejected, 17)]),
        new("Tideglass Studios", "UI Engineer", 64, [(StatusApplied, 0), (StatusRejected, 9)]),
        new("Redcedar Networks", "Senior Frontend Developer", 61, [(StatusApplied, 0), (StatusInterview, 15), (StatusOffer, 54)], "https://redcedar.example/careers/senior-frontend"),
        new("Umberline Mobility", "Angular Developer", 56, [(StatusApplied, 0), (StatusInterview, 9), (StatusRejected, 22)]),
        new("Stonebridge Retail", "Full-stack Developer", 49, [(StatusApplied, 0), (StatusInterview, 18), (StatusOffer, 45)], "https://stonebridge.example/jobs/fullstack-developer"),
        new("Vantage Row", "Product Engineer", 47, [(StatusApplied, 0), (StatusRejected, 14)]),
        new("Jetstone Logistics", "Senior Frontend Developer", 44, [(StatusApplied, 0), (StatusInterview, 31)], "https://careers.jetstone.example/senior-frontend"),
        new("Westford Digital", "Frontend Developer", 41, [(StatusApplied, 0)]),
        new("Kilnworks Digital", "Full-stack Developer", 39, [(StatusApplied, 0), (StatusInterview, 28)]),
        new("Yarrow Systems", "Full-stack Developer", 38, [(StatusSaved, 0), (StatusApplied, 3)]),
        new("Thornbury Interactive", "Product Engineer", 36, [(StatusApplied, 0), (StatusInterview, 14), (StatusOffer, 34)], "https://thornbury.example/careers/product-engineer"),
        new("Zephyr Grid", "Senior Frontend Developer", 34, [(StatusApplied, 0)]),
        new("Larkspur Health", "Angular Developer", 33, [(StatusSaved, 0), (StatusApplied, 3), (StatusInterview, 24)]),
        new("Alderpoint Media", "Web Developer", 30, [(StatusApplied, 0)]),
        new("Moonfield Studios", "Frontend Engineer", 29, [(StatusApplied, 0), (StatusInterview, 22)]),
        new("Bramblewood Games", "Frontend Engineer", 27, [(StatusApplied, 0)]),
        new("Nimbus Row", "Software Engineer", 26, [(StatusApplied, 0), (StatusInterview, 19)]),
        new("Cinderpath Security", "Angular Developer", 24, [(StatusSaved, 0), (StatusApplied, 2)]),
        new("Oakhaven Bank", "Full-stack Engineer", 23, [(StatusApplied, 0), (StatusInterview, 17)], "https://oakhavenbank.example/careers/fullstack-engineer"),
        new("Duskford Analytics", "Software Engineer", 21, [(StatusApplied, 0)]),
        new("Pillarpoint Systems", "Senior Software Engineer", 19, [(StatusApplied, 0), (StatusInterview, 15)], "https://pillarpoint.example/jobs/senior-software-engineer"),
        new("Elmgate Insurance", ".NET Developer", 18, [(StatusApplied, 0)]),
        new("Quillstone Software", "Frontend Team Lead", 16, [(StatusApplied, 0), (StatusInterview, 12)], "https://quillstone.example/jobs/frontend-team-lead"),
        new("Foxglove Payments", "Full-stack Engineer", 15, [(StatusApplied, 0)], "https://foxglovepayments.example/careers/fullstack"),
        new("Glasswing Software", "TypeScript Developer", 12, [(StatusApplied, 0)]),
        new("Hollowbrook Energy", "Frontend Developer", 9, [(StatusApplied, 0)]),
        new("Upriver Labs", "Frontend Developer", 8, [(StatusSaved, 0)]),
        new("Inkwell Publishing", "React Developer", 6, [(StatusApplied, 0)]),
        new("Violetstone Cloud", "Angular Developer", 6, [(StatusSaved, 0)]),
        new("Wildgrass Mobility", "Full-stack Engineer", 4, [(StatusSaved, 0)]),
        new("Xanthe Digital", "UI Engineer", 2, [(StatusSaved, 0)]),
        new("Yewbrook Analytics", "Software Engineer", 1, [(StatusSaved, 0)])
    ];

    private static Job[] BuildJobs(int userId) =>
        JobSeeds
            .Select(seed => new Job
            {
                UserId = userId,
                Company = seed.Company,
                Position = seed.Position,
                Link = seed.Link,
                Date = DateAt(-seed.AppliedDaysAgo),
                Status = seed.Timeline[^1].Status,
                UpdatedAt = MomentAt(seed.Timeline[^1].Day - seed.AppliedDaysAgo, 10)
            })
            .ToArray();

    private static JobStatusHistory[] BuildStatusHistory(int userId, Job[] jobs) =>
        jobs
            .SelectMany((job, index) => JobSeeds[index].Timeline.Select(step => new JobStatusHistory
            {
                JobId = job.Id,
                UserId = userId,
                Status = step.Status,
                ChangedAt = MomentAt(step.Day - JobSeeds[index].AppliedDaysAgo, 10)
            }))
            .ToArray();

    private static CalendarEvent[] BuildCalendarEvents(int userId) =>
    [
        new CalendarEvent { UserId = userId, Type = EventTakeHomeTask, Company = "Meridian Nine", Date = DateAt(-98), Time = "12:00", Notes = "Two-day take-home: a small analytics dashboard with charts and filters. Submitted a day early." },
        new CalendarEvent { UserId = userId, Type = EventHrScreening, Company = "Quartzline Data", Date = DateAt(-78), Time = "09:00", Notes = "Intro call with the recruiter. Team size, remote policy and salary range discussed." },
        new CalendarEvent { UserId = userId, Type = EventTechnicalInterview, Company = "Umberline Mobility", Date = DateAt(-47), Time = "11:00", Notes = "Live coding on RxJS operators and a small routing refactor. Went well overall." },
        new CalendarEvent { UserId = userId, Type = EventSystemDesign, Company = "Redcedar Networks", Date = DateAt(-46), Time = "10:00", Notes = "Designed a multi-tenant admin portal. Focus on caching layers and role-based access." },
        new CalendarEvent { UserId = userId, Type = EventTechnicalInterview, Company = "Stonebridge Retail", Date = DateAt(-31), Time = "14:30", Notes = "Pair programming on a checkout flow bug, then questions about state management." },
        new CalendarEvent { UserId = userId, Type = EventTechnicalInterview, Company = "Thornbury Interactive", Date = DateAt(-22), Time = "13:00", Notes = "Two-hour session: TypeScript generics, testing strategy and a short architecture review." },
        new CalendarEvent { UserId = userId, Type = EventSystemDesign, Company = "Jetstone Logistics", Date = DateAt(-13), Time = "10:00", Notes = "Designed a shipment tracking feed. Discussed WebSocket fan-out and offline handling." },
        new CalendarEvent { UserId = userId, Type = EventTechnicalInterview, Company = "Kilnworks Digital", Date = DateAt(-11), Time = "14:30", Notes = "Deep dive into change detection and bundle size. Asked to walk through a past refactor." },
        new CalendarEvent { UserId = userId, Type = EventTechnicalInterview, Company = "Larkspur Health", Date = DateAt(-9), Time = "13:00", Notes = "Accessibility-heavy round: keyboard navigation, ARIA and form validation patterns." },
        new CalendarEvent { UserId = userId, Type = EventOfferDiscussion, Company = "Redcedar Networks", Date = DateAt(-7), Time = "15:30", Notes = "First offer numbers on the table. Asked for a week to compare with the other processes." },
        new CalendarEvent { UserId = userId, Type = EventHrScreening, Company = "Moonfield Studios", Date = DateAt(-7), Time = "09:30", Notes = "Recruiter screen. Mostly notice period, remote days and preferred stack." },
        new CalendarEvent { UserId = userId, Type = EventTechnicalInterview, Company = "Nimbus Row", Date = DateAt(2), Time = "15:00", Notes = "Second round with two engineers. Prepare the component library case study." },
        new CalendarEvent { UserId = userId, Type = EventTechnicalInterview, Company = "Quillstone Software", Date = DateAt(3), Time = "14:00", Notes = "Team lead track: half technical, half people questions. Review last year's mentoring examples." },
        new CalendarEvent { UserId = userId, Type = EventSystemDesign, Company = "Pillarpoint Systems", Date = DateAt(5), Time = "10:00", Notes = "Whiteboard round. Likely topics: rate limiting and an event-driven notification pipeline." },
        new CalendarEvent { UserId = userId, Type = EventTakeHomeTask, Company = "Oakhaven Bank", Date = DateAt(6), Time = "18:00", Notes = "Take-home deadline: a transaction list with filtering, pagination and unit tests." },
        new CalendarEvent { UserId = userId, Type = EventOfferDiscussion, Company = "Thornbury Interactive", Date = DateAt(8), Time = "11:30", Notes = "Offer call with the hiring manager. Bring the questions about equity and the review cycle." },
        new CalendarEvent { UserId = userId, Type = EventOfferDiscussion, Company = "Stonebridge Retail", Date = DateAt(12), Time = "16:00", Notes = "Final negotiation. Decide between this one and Redcedar before the end of the week." }
    ];

    private static PlannerTask[] BuildPlannerTasks(int userId) =>
    [
        new PlannerTask { UserId = userId, Text = "Rehearse the component library case study for Nimbus Row", Completed = false, SortOrder = 1 },
        new PlannerTask { UserId = userId, Text = "Practise a system design walkthrough: rate limiter and notification fan-out", Completed = false, SortOrder = 2 },
        new PlannerTask { UserId = userId, Text = "Prepare the salary range and equity questions for the Thornbury offer call", Completed = false, SortOrder = 3 },
        new PlannerTask { UserId = userId, Text = "Read up on the Oakhaven Bank stack before starting the take-home", Completed = false, SortOrder = 4 },
        new PlannerTask { UserId = userId, Text = "Follow up with Duskford Analytics - three weeks, no reply", Completed = false, SortOrder = 5 },
        new PlannerTask { UserId = userId, Text = "Send a thank-you note after the Kilnworks technical round", Completed = true, SortOrder = 6 },
        new PlannerTask { UserId = userId, Text = "Update the LinkedIn headline and featured projects", Completed = true, SortOrder = 7 },
        new PlannerTask { UserId = userId, Text = "Rewrite the CV summary for team lead roles", Completed = true, SortOrder = 8 },
        new PlannerTask { UserId = userId, Text = "Book a mock interview with a former colleague", Completed = true, SortOrder = 9 }
    ];

    private static UserDocument[] BuildDocuments(int userId) =>
    [
        new UserDocument { UserId = userId, Name = "Doe_John_Frontend_CV_EN.pdf", Type = "Önéletrajz", Updated = DateAt(-14), Version = "v3.2" },
        new UserDocument { UserId = userId, Name = "Doe_John_Fullstack_CV_EN.pdf", Type = "Önéletrajz", Updated = DateAt(-41), Version = "v2.5" },
        new UserDocument { UserId = userId, Name = "Doe_John_Team_Lead_CV_EN.pdf", Type = "Önéletrajz", Updated = DateAt(-6), Version = "v1.1" },
        new UserDocument { UserId = userId, Name = "Cover_Letter_General_EN.docx", Type = "Kísérőlevél", Updated = DateAt(-52), Version = "v1.4" },
        new UserDocument { UserId = userId, Name = "Cover_Letter_Fintech_EN.docx", Type = "Kísérőlevél", Updated = DateAt(-20), Version = "v1.0" },
        new UserDocument { UserId = userId, Name = "Portfolio_Case_Studies_EN.pdf", Type = "Egyéb", Updated = DateAt(-33), Version = "v2.0" },
        new UserDocument { UserId = userId, Name = "Reference_Contacts_EN.pdf", Type = "Egyéb", Updated = DateAt(-88), Version = "v1.1" }
    ];

    private static PracticeQuestion[] BuildPracticeQuestions(int userId) =>
    [
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeTechnical,
            Question = "How does Angular change detection work, and what does the OnPush strategy actually change?",
            Hint = "zone.js, the component tree walk, reference equality on inputs, signals as the granular alternative.",
            SampleAnswer = "By default Angular patches the async APIs through zone.js, so any timer, event or HTTP callback triggers a change detection pass that walks the whole component tree and re-evaluates every template binding. With OnPush a component is only checked when one of its input references changes, when an event fires inside it, or when it is marked dirty explicitly, which removes most of the redundant work in a large tree. Signals go one step further: reading a signal in a template registers a fine-grained dependency, so only the expressions that actually depend on the changed value are recomputed. The mental model is the same one behind a virtual DOM diff - work out the minimal set of updates in memory instead of touching the DOM on every state change."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeTechnical,
            Question = "When would you reach for a full state management library instead of a service with signals?",
            Hint = "Local vs shared vs global state, boilerplate cost, debugging tools, team size.",
            SampleAnswer = "Local UI state belongs in the component, and a signal is enough for it. Shared state in a small or mid-sized app is best served by an injectable service holding signals: it is reactive, testable and has almost no boilerplate. A library like NgRx earns its cost when there is a large team, many cross-cutting side effects, and you genuinely need the audit trail that actions and reducers give you, plus time-travel debugging in the devtools. The rule I follow is not to introduce the complexity until the problem demands it, because a store added too early mostly buys indirection."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeTechnical,
            Question = "Explain CSS specificity and how it causes trouble in a large codebase.",
            Hint = "Inline beats id, id beats class, class beats element. BEM, scoped styles and utility classes as the way out.",
            SampleAnswer = "Specificity decides which rule wins a conflict: inline styles beat ids, ids beat classes and pseudo-classes, which beat element selectors. In a large codebase this turns into a specificity war - someone cannot override a rule, so they add another id or an !important, and the next person has to go one level higher again. The fixes are structural rather than clever: a naming convention like BEM keeps everything at a single class level, component-scoped styles stop rules leaking, and a utility-first approach keeps every class at the same specificity so source order is the only tie-breaker."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeTechnical,
            Question = "What are TypeScript generics and when are they worth introducing?",
            Hint = "Type safety without duplication. Constraints, default type arguments, inference.",
            SampleAnswer = "A generic is a type parameter that lets a function or a class work with many types while keeping the exact type information at the call site. Without it you either duplicate the implementation per type or fall back to any and lose all safety. They pay off in reusable infrastructure: repositories, API response wrappers, form helpers, caches. Constraints such as T extends object narrow what callers may pass, and default type arguments keep the common case short. Where they are not worth it is ordinary application code with one concrete type - a generic there only makes the signature harder to read."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeTechnical,
            Question = "How do you track down a memory leak in a single page application?",
            Hint = "Heap snapshots, detached DOM nodes, unsubscribed streams, listeners left on window.",
            SampleAnswer = "I start in the browser memory profiler: take a heap snapshot, exercise the suspect flow a few times, take another, then compare the allocations that survive. Detached DOM nodes in the diff usually point straight at the cause. In an Angular app the usual suspects are subscriptions that are never torn down, listeners added to window or document without removal, timers left running, and caches that grow without bound. The fixes are the boring ones: takeUntilDestroyed or the async pipe instead of manual subscribes, removing listeners in ngOnDestroy, and giving any long-lived cache an eviction rule."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeHr,
            Question = "Tell me about a time you disagreed with a teammate. How did you resolve it?",
            Hint = "Use STAR. Focus on empathy, evidence and the compromise you landed on.",
            SampleAnswer = "On one project the product manager wanted to ship an animation-heavy landing section immediately, and I thought it would hurt accessibility and performance. Instead of arguing in the standup I built both versions and ran them through a performance and accessibility audit, then shared the numbers. I proposed a CSS-only transition that kept the visual intent but dropped the main-thread cost and stayed usable with a keyboard and a screen reader. We shipped that version on the original date. The lesson I took away is that a measured proposal moves a disagreement forward much faster than a strongly held opinion."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeHr,
            Question = "Where do you see yourself professionally in five years?",
            Hint = "Show commitment to continuous learning and to a tech lead or mentoring track.",
            SampleAnswer = "I want to go deeper on frontend architecture and performance work, and I would like to be in a position where I am also shaping technical decisions and mentoring other developers - a tech lead track rather than a pure management one. What matters to me is staying close to the code while taking on more responsibility for direction. This role fits that because the product is large enough to have real architectural problems, and the team is growing, which usually means there is room to take ownership."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeHr,
            Question = "Walk me through a project you are proud of and what your exact contribution was.",
            Hint = "Be concrete about your own part, the constraints and the measurable outcome.",
            SampleAnswer = "I rebuilt the reporting module of an internal tool that took about eight seconds to render a typical dataset. My part was the frontend architecture and the data layer: I replaced the eager load with a paged endpoint, added virtual scrolling so only the visible rows exist in the DOM, and moved the aggregation to the server. I also wrote the test suite for the new data layer, because the old module had none. Time to first render went from roughly eight seconds to under one, and the support tickets about the page freezing stopped entirely."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeHr,
            Question = "Why are you looking to leave your current role?",
            Hint = "Stay positive - talk about what you are moving towards rather than what you are escaping.",
            SampleAnswer = "I have learned a lot where I am, especially about maintaining a long-lived codebase, but the product has settled into a maintenance rhythm and the technical problems have got smaller. I am looking for a place where I can work on architecture again and where there is a team to learn from and to mentor. I am not leaving because of people or process - I would happily give a reference from my current lead - it is simply that the growth curve has flattened and I want the next steep part of it."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeSystemDesign,
            Question = "How would you design an image-heavy social feed that still loads fast?",
            Hint = "CDN, modern formats, responsive sources, lazy loading, list virtualisation, placeholders.",
            SampleAnswer = "I would split it into delivery and rendering. On delivery: serve the images from a CDN in modern formats such as WebP or AVIF, generate several widths and let srcset pick, and cache aggressively behind content-hashed URLs. On rendering: lazy load anything below the fold with the native loading attribute or an intersection observer, reserve the layout box up front so nothing shifts, and show a low quality blurred placeholder while the real file arrives. For the list itself I would virtualise, so only twenty or thirty items exist in the DOM regardless of feed length, and prefetch the next page as the user approaches the end."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeSystemDesign,
            Question = "Design a real-time notification system for a chat product.",
            Hint = "WebSocket vs SSE vs polling, reconnection, ordering, offline delivery, horizontal scale.",
            SampleAnswer = "For two-way, low latency traffic I would use WebSockets, with server-sent events as the fallback where only server-to-client push is needed. Clients connect to a gateway tier that is stateless apart from the socket itself, and the gateways coordinate through a pub/sub layer such as Redis so any instance can deliver to any user - that is what makes horizontal scaling possible. Messages carry a monotonic sequence number per conversation so clients can detect gaps and re-request. Anything undelivered goes to a durable queue and is replayed on reconnect. On the client I would implement reconnection with exponential backoff and jitter, and surface the connection state in the UI so people know when they are looking at stale data."
        },
        new PracticeQuestion
        {
            UserId = userId,
            Category = PracticeSystemDesign,
            Question = "How would you design an offline-first web app for field engineers with unreliable connectivity?",
            Hint = "Service worker, local database, sync queue, conflict resolution, honest UI state.",
            SampleAnswer = "The local store becomes the source of truth for the session: IndexedDB holds the work orders and the app reads and writes there first, so the UI never blocks on the network. A service worker caches the shell and the assets so the app starts with no connection at all. Every mutation is appended to an outbox queue with a client-generated id, and a background sync drains it when connectivity returns, retrying with backoff. For conflicts I would prefer per-field last-write-wins with server timestamps for simple attributes, and an explicit review screen for anything that cannot be merged safely. The UI has to be honest about it: show what is pending, what is synced and what failed, otherwise people stop trusting the data."
        }
    ];

    private static readonly AttemptSeed[] AttemptSeeds =
    [
        new(0, 38, FeedbackIncorrect, "Angular re-renders the whole page whenever something changes, and OnPush turns that off."),
        new(4, 31, FeedbackIncorrect, "I would restart the browser and check whether memory usage drops back, then look at which page was open at the time."),
        new(6, 26, FeedbackCorrect, "In five years I want to be a tech lead who still writes code: deeper on frontend architecture and performance, and mentoring the people around me. This role has enough architectural weight and a growing team, so both parts are realistic here."),
        new(3, 21, FeedbackCorrect, "A generic is a type parameter, so one implementation can serve many types without falling back to any. I use them for repositories, API wrappers and form helpers, with constraints to limit what callers can pass. For a single concrete type they only add noise."),
        new(10, 17, FeedbackIncorrect, "I would poll the server every few seconds for new messages and append them to the list."),
        new(2, 13, FeedbackCorrect, "Specificity ranks inline styles above ids, ids above classes, classes above elements. In a big codebase it escalates until everything is !important, so I keep one class level with BEM, scope component styles, and let source order break ties instead of selector weight."),
        new(1, 11, FeedbackCorrect, "Local state goes in a component signal, shared state in an injectable service holding signals. I only reach for a store when there are many cross-cutting side effects and a big team that needs the action log and devtools, because otherwise it is mostly indirection."),
        new(9, 9, FeedbackIncorrect, "I would compress the images before upload and load them all at once so scrolling stays smooth."),
        new(5, 6, FeedbackCorrect, "A product manager wanted to ship an animation-heavy section I thought would hurt accessibility. I measured both versions, shared the numbers, and proposed a CSS-only alternative that kept the look. We shipped on the original date and the audit score stayed green."),
        new(0, 4, FeedbackCorrect, "By default zone.js patches the async APIs, so any event triggers a pass over the component tree. OnPush limits checks to input reference changes and events inside the component, and signals make it finer still by tracking exactly which expressions read the changed value.")
    ];

    private static PracticeAttempt[] BuildPracticeAttempts(int userId, PracticeQuestion[] questions) =>
        AttemptSeeds
            .Where(seed => seed.QuestionIndex < questions.Length)
            .Select(seed =>
            {
                var question = questions[seed.QuestionIndex];
                return new PracticeAttempt
                {
                    UserId = userId,
                    PracticeQuestionId = question.Id,
                    Category = question.Category,
                    Question = question.Question,
                    UserAnswer = seed.Answer,
                    Feedback = seed.Feedback,
                    CreatedAt = MomentAt(-seed.DaysAgo, 19)
                };
            })
            .ToArray();

    private static void ApplyLatestFeedback(PracticeQuestion[] questions, PracticeAttempt[] attempts)
    {
        foreach (var question in questions)
        {
            question.Feedback = attempts
                .Where(a => a.PracticeQuestionId == question.Id)
                .OrderByDescending(a => a.CreatedAt)
                .FirstOrDefault()?.Feedback;
        }
    }
}
