using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class AuthService(
    IAppUserRepository repo,
    IJwtService jwt,
    IDemoResetService demoReset,
    IJobStatusConfigRepository statusConfigRepo,
    IEventTypeRepository eventTypeRepo,
    IPracticeQuestionRepository practiceQuestionRepo,
    IPracticeCategoryRepository practiceCategoryRepo) : IAuthService
{
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await repo.GetByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)) return null;

        await demoReset.ResetIfDemoAccountAsync(user.Id, user.Email);

        return new AuthResponse(jwt.GenerateToken(user), MapProfile(user));
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await repo.GetByEmailAsync(email) is not null) return null;

        var user = new AppUser
        {
            FirstName    = request.FirstName.Trim(),
            LastName     = request.LastName.Trim(),
            Email        = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone        = string.Empty,
            Position     = string.Empty,
            Goal         = 30,
            JoinDate     = DateTime.Now.ToString("yyyy. MMMM", new System.Globalization.CultureInfo("hu-HU"))
        };
        await repo.AddAsync(user);
        await SeedDefaultStatusConfigsAsync(user.Id);
        await SeedDefaultEventTypesAsync(user.Id);
        await SeedDefaultPracticeCategoriesAsync(user.Id);
        await SeedDefaultPracticeQuestionsAsync(user.Id);

        return new AuthResponse(jwt.GenerateToken(user), MapProfile(user));
    }

    private async Task SeedDefaultStatusConfigsAsync(int userId)
    {
        var defaults = new[]
        {
            new JobStatusConfig { UserId = userId, Key = "Mentett", Label = "Mentett", Color = "#9b9b99", SortOrder = 0 },
            new JobStatusConfig { UserId = userId, Key = "Beadva", Label = "Beadva", Color = "#5fb9fa", SortOrder = 1 },
            new JobStatusConfig { UserId = userId, Key = "Visszahivas", Label = "Visszahívás", Color = "#f59e0b", SortOrder = 2 },
            new JobStatusConfig { UserId = userId, Key = "Ajanlat", Label = "Ajánlat", Color = "#26ac00", SortOrder = 3 },
            new JobStatusConfig { UserId = userId, Key = "Elutasitva", Label = "Elutasítva", Color = "#ef4444", SortOrder = 4 }
        };
        foreach (var config in defaults) await statusConfigRepo.AddAsync(config);
    }

    private async Task SeedDefaultEventTypesAsync(int userId)
    {
        var defaults = new[]
        {
            new EventType { UserId = userId, Name = "HR Megkeresés" },
            new EventType { UserId = userId, Name = "Technikai Interjú" },
            new EventType { UserId = userId, Name = "Rendszertervezés" },
            new EventType { UserId = userId, Name = "Tesztfeladat" },
            new EventType { UserId = userId, Name = "Ajánlat egyeztetés" }
        };
        foreach (var type in defaults) await eventTypeRepo.AddAsync(type);
    }

    private async Task SeedDefaultPracticeCategoriesAsync(int userId)
    {
        var defaults = new[]
        {
            new PracticeCategory { UserId = userId, Name = "Technikai", Color = "#26ac00" },
            new PracticeCategory { UserId = userId, Name = "HR", Color = "#f59e0b" },
            new PracticeCategory { UserId = userId, Name = "Rendszertervezés", Color = "#8b5cf6" }
        };
        foreach (var category in defaults) await practiceCategoryRepo.AddAsync(category);
    }

    private async Task SeedDefaultPracticeQuestionsAsync(int userId)
    {
        var defaults = new[]
        {
            new PracticeQuestion
            {
                UserId = userId,
                Category = "Technikai",
                Question = "Hogyan működik a React/Angular Virtual DOM / Change Detection és miért nyújt jobb teljesítményt?",
                Hint = "Angularban: zone.js, OnPush stratégia, signals. Általánosan: diffing algoritmus, batch update.",
                SampleAnswer = "Az Angular alapból zone.js segítségével figyeli az aszinkron eseményeket és indít change detection ciklust. Az OnPush stratégiával csak akkor fut le, ha az Input-ok referenciája változik. Az újabb Signals rendszerben a reaktivitás granulárissá válik: csak a signal-t olvasó kifejezések frissülnek."
            },
            new PracticeQuestion
            {
                UserId = userId,
                Category = "HR",
                Question = "Mesélj el egy helyzetet, amikor nézeteltérésed volt egy fejlesztőtársaddal. Hogyan oldottad meg?",
                Hint = "Használd a STAR módszert. Fókuszálj az empátiára, az adatokon alapuló érvelésre és a kompromisszumra.",
                SampleAnswer = "Egy projektben a PM azonnali kiadást kért, ami szerintem rontotta a minőséget. Ahelyett, hogy konfrontálódtam volna, méréseket végeztem és bemutattam egy kompromisszumos megoldást. A tanulság: az adatokkal alátámasztott javaslat sokkal meggyőzőbb a konfrontációnál."
            },
            new PracticeQuestion
            {
                UserId = userId,
                Category = "Rendszertervezés",
                Question = "Hogyan terveznél meg egy képekkel teli közösségi feedet minimális betöltési idővel?",
                Hint = "Lazy loading, CDN, modern képformátumok, lista-virtualizáció.",
                SampleAnswer = "CDN-t használnék modern formátumokban (WebP/AVIF) és reszponzív méretekben tárolt képekhez, Intersection Observer alapú lazy loading-gal és virtualizált listával (pl. CDK Virtual Scroll), hogy mindig csak a látható elemek legyenek a DOM-ban."
            }
        };
        foreach (var question in defaults) await practiceQuestionRepo.AddAsync(question);
    }

    private static UserProfileResponse MapProfile(AppUser u) =>
        new(u.Id, u.FirstName, u.LastName, u.Position, u.Email, u.Phone, u.Goal, u.JoinDate, u.AvatarBlobName is not null);
}
