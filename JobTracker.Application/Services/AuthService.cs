using JobTracker.Application.DTOs;
using JobTracker.Application.Interfaces;
using JobTracker.Application.Mapping;
using JobTracker.Domain.Entities;
using JobTracker.Domain.Interfaces;

namespace JobTracker.Application.Services;

public sealed class AuthService(
    IAppUserRepository repo,
    IJwtService jwt,
    IDemoResetService demoReset,
    IGoogleAuthService googleAuth,
    IFacebookAuthService facebookAuth,
    IJobStatusConfigRepository statusConfigRepo,
    IEventTypeRepository eventTypeRepo,
    IJobSourceRepository jobSourceRepo,
    IPracticeQuestionRepository practiceQuestionRepo,
    IPracticeCategoryRepository practiceCategoryRepo) : IAuthService
{
    public async Task<AuthResponse?> LoginAsync(LoginRequest request)
    {
        var user = await repo.GetByEmailAsync(request.Email.Trim().ToLowerInvariant());
        if (user is null) return null;
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)) return null;

        await demoReset.ResetIfDemoAccountAsync(user.Id, user.Email);

        return new AuthResponse(jwt.GenerateToken(user), user.ToResponse());
    }

    public async Task<AuthResponse?> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await repo.GetByEmailAsync(email) is not null) return null;

        var user = new AppUser
        {
            FirstName = request.FirstName.Trim(),
            LastName = request.LastName.Trim(),
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Phone = string.Empty,
            Position = string.Empty,
            Goal = 30,
            JoinDate = DateTime.Now.ToString("yyyy. MMMM", new System.Globalization.CultureInfo("hu-HU")),
            PreferredLanguage = request.PreferredLanguage is "en" or "hu" ? request.PreferredLanguage : "hu"
        };
        user.ApplyCareerFields(request);
        await repo.AddAsync(user);
        await SeedDefaultsAsync(user.Id);

        return new AuthResponse(jwt.GenerateToken(user), user.ToResponse());
    }

    public async Task<AuthResponse?> GoogleLoginAsync(string idToken)
    {
        var info = await googleAuth.ValidateAsync(idToken);
        if (info is null) return null;

        var user = await ResolveExternalUserAsync(info, isGoogle: true);
        await demoReset.ResetIfDemoAccountAsync(user.Id, user.Email);

        return new AuthResponse(jwt.GenerateToken(user), user.ToResponse());
    }

    public async Task<AuthResponse?> FacebookLoginAsync(string accessToken)
    {
        var info = await facebookAuth.ValidateAsync(accessToken);
        if (info is null) return null;

        var user = await ResolveExternalUserAsync(info, isGoogle: false);
        await demoReset.ResetIfDemoAccountAsync(user.Id, user.Email);

        return new AuthResponse(jwt.GenerateToken(user), user.ToResponse());
    }

    private async Task<AppUser> ResolveExternalUserAsync(ExternalUserInfo info, bool isGoogle)
    {
        var existing = isGoogle
            ? await repo.GetByGoogleIdAsync(info.ProviderId)
            : await repo.GetByFacebookIdAsync(info.ProviderId);
        if (existing is not null) return existing;

        var email = info.Email.Trim().ToLowerInvariant();
        var byEmail = await repo.GetByEmailAsync(email);
        if (byEmail is not null)
        {
            if (isGoogle) byEmail.GoogleId = info.ProviderId;
            else byEmail.FacebookId = info.ProviderId;
            return await repo.UpdateAsync(byEmail);
        }

        var user = new AppUser
        {
            FirstName = info.FirstName,
            LastName = info.LastName,
            Email = email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()),
            Phone = string.Empty,
            Position = string.Empty,
            Goal = 30,
            JoinDate = DateTime.Now.ToString("yyyy. MMMM", new System.Globalization.CultureInfo("hu-HU")),
            GoogleId = isGoogle ? info.ProviderId : null,
            FacebookId = isGoogle ? null : info.ProviderId
        };
        await repo.AddAsync(user);
        await SeedDefaultsAsync(user.Id);

        return user;
    }

    private async Task SeedDefaultsAsync(int userId)
    {
        await SeedDefaultStatusConfigsAsync(userId);
        await SeedDefaultEventTypesAsync(userId);
        await SeedDefaultJobSourcesAsync(userId);
        await SeedDefaultPracticeCategoriesAsync(userId);
        await SeedDefaultPracticeQuestionsAsync(userId);
    }

    private async Task SeedDefaultStatusConfigsAsync(int userId)
    {
        foreach (var config in DefaultStatusConfigs.For(userId)) await statusConfigRepo.AddAsync(config);
    }

    private async Task SeedDefaultEventTypesAsync(int userId)
    {
        var defaults = new[]
        {
            new EventType { UserId = userId, Name = "HR Screening", Color = "#f59e0b" },
            new EventType { UserId = userId, Name = "Technical Interview", Color = "#5fb9fa" },
            new EventType { UserId = userId, Name = "System Design", Color = "#8b5cf6" },
            new EventType { UserId = userId, Name = "Take-home Task", Color = "#f97316" },
            new EventType { UserId = userId, Name = "Offer Discussion", Color = "#26ac00" }
        };
        foreach (var type in defaults) await eventTypeRepo.AddAsync(type);
    }

    private async Task SeedDefaultJobSourcesAsync(int userId) =>
        await jobSourceRepo.AddRangeAsync(DefaultJobSources.For(userId));

    private async Task SeedDefaultPracticeCategoriesAsync(int userId)
    {
        var defaults = new[]
        {
            new PracticeCategory { UserId = userId, Name = "Technical", Color = "#26ac00" },
            new PracticeCategory { UserId = userId, Name = "HR", Color = "#f59e0b" },
            new PracticeCategory { UserId = userId, Name = "System Design", Color = "#8b5cf6" }
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
                Category = "Technical",
                Question = "How does Angular change detection work, and what does the OnPush strategy actually change?",
                Hint = "zone.js, the component tree walk, reference equality on inputs, signals as the granular alternative.",
                SampleAnswer = "By default Angular patches the async APIs through zone.js, so any event triggers a change detection pass over the whole component tree. With OnPush a component is only checked when an input reference changes, when an event fires inside it, or when it is marked dirty explicitly. Signals go further still: reading a signal registers a fine-grained dependency, so only the expressions that depend on the changed value are recomputed."
            },
            new PracticeQuestion
            {
                UserId = userId,
                Category = "HR",
                Question = "Tell me about a time you disagreed with a teammate. How did you resolve it?",
                Hint = "Use STAR. Focus on empathy, evidence and the compromise you landed on.",
                SampleAnswer = "On one project the product manager wanted to ship immediately and I thought the quality was not there yet. Instead of arguing in the standup I measured both options and brought the numbers, then proposed a smaller version we could ship on the original date. The lesson I took away is that a measured proposal moves a disagreement forward much faster than a strongly held opinion."
            },
            new PracticeQuestion
            {
                UserId = userId,
                Category = "System Design",
                Question = "How would you design an image-heavy social feed that still loads fast?",
                Hint = "CDN, modern formats, responsive sources, lazy loading, list virtualisation.",
                SampleAnswer = "I would serve the images from a CDN in modern formats such as WebP or AVIF, generate several widths and let srcset pick the right one. Below the fold everything is lazy loaded with a reserved layout box so nothing shifts, and the list itself is virtualised, so only the visible rows exist in the DOM regardless of feed length."
            }
        };
        foreach (var question in defaults) await practiceQuestionRepo.AddAsync(question);
    }
}
