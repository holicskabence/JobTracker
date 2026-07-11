using JobTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Data;

public sealed class JobTrackerDbContext(DbContextOptions<JobTrackerDbContext> options)
    : DbContext(options)
{
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<JobStatusHistory> JobStatusHistories => Set<JobStatusHistory>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<PlannerTask> PlannerTasks => Set<PlannerTask>();
    public DbSet<UserDocument> UserDocuments => Set<UserDocument>();
    public DbSet<EventType> EventTypes => Set<EventType>();
    public DbSet<JobStatusConfig> JobStatusConfigs => Set<JobStatusConfig>();
    public DbSet<PracticeQuestion> PracticeQuestions => Set<PracticeQuestion>();
    public DbSet<PracticeCategory> PracticeCategories => Set<PracticeCategory>();
    public DbSet<PracticeAttempt> PracticeAttempts => Set<PracticeAttempt>();
    public DbSet<AppUser> Users => Set<AppUser>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        builder.Entity<Job>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Company).IsRequired().HasMaxLength(200);
            e.Property(x => x.Position).IsRequired().HasMaxLength(200);
            e.Property(x => x.Date).IsRequired().HasMaxLength(10);
            e.Property(x => x.Status).IsRequired().HasMaxLength(50);
            e.Property(x => x.UpdatedAt).IsRequired().HasDefaultValueSql("GETUTCDATE()");
            e.HasIndex(x => x.UserId);
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<JobStatusHistory>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Status).IsRequired().HasMaxLength(50);
            e.HasIndex(x => x.JobId);
            e.HasIndex(x => x.UserId);
            e.HasOne<Job>().WithMany().HasForeignKey(x => x.JobId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Restrict);
        });

        builder.Entity<CalendarEvent>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).IsRequired().HasMaxLength(100);
            e.Property(x => x.Company).IsRequired().HasMaxLength(200);
            e.Property(x => x.Date).IsRequired().HasMaxLength(10);
            e.Property(x => x.Time).IsRequired().HasMaxLength(5);
            e.Property(x => x.Notes).HasMaxLength(1000);
            e.HasIndex(x => x.UserId);
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PlannerTask>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Text).IsRequired().HasMaxLength(500);
            e.HasIndex(x => x.UserId);
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<UserDocument>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Type).IsRequired().HasMaxLength(100);
            e.Property(x => x.Updated).IsRequired().HasMaxLength(10);
            e.Property(x => x.Version).IsRequired().HasMaxLength(50);
            e.Property(x => x.BlobName).HasMaxLength(500);
            e.Property(x => x.FileName).HasMaxLength(260);
            e.HasIndex(x => x.UserId);
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<EventType>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.HasIndex(x => new { x.UserId, x.Name }).IsUnique();
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<JobStatusConfig>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).IsRequired().HasMaxLength(50);
            e.Property(x => x.Label).IsRequired().HasMaxLength(100);
            e.Property(x => x.Color).IsRequired().HasMaxLength(20);
            e.Property(x => x.ShowInKanban).HasDefaultValue(true);
            e.Property(x => x.IsActive).HasDefaultValue(false);
            e.Property(x => x.IsInterview).HasDefaultValue(false);
            e.Property(x => x.StatsCategory).IsRequired().HasMaxLength(20).HasDefaultValue("None");
            e.HasIndex(x => new { x.UserId, x.Key }).IsUnique();
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PracticeQuestion>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Category).IsRequired().HasMaxLength(50);
            e.Property(x => x.Question).IsRequired().HasMaxLength(1000);
            e.Property(x => x.Hint).HasMaxLength(1000);
            e.Property(x => x.SampleAnswer).HasMaxLength(4000);
            e.Property(x => x.Feedback).HasMaxLength(20);
            e.HasIndex(x => x.UserId);
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PracticeCategory>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(50);
            e.Property(x => x.Color).IsRequired().HasMaxLength(20);
            e.HasIndex(x => new { x.UserId, x.Name }).IsUnique();
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<PracticeAttempt>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Category).IsRequired().HasMaxLength(50);
            e.Property(x => x.Question).IsRequired().HasMaxLength(1000);
            e.Property(x => x.UserAnswer).HasMaxLength(4000);
            e.Property(x => x.Feedback).IsRequired().HasMaxLength(20);
            e.HasIndex(x => x.UserId);
            e.HasOne<AppUser>().WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        builder.Entity<AppUser>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.FirstName).IsRequired().HasMaxLength(100);
            e.Property(x => x.LastName).IsRequired().HasMaxLength(100);
            e.Property(x => x.Email).IsRequired().HasMaxLength(200);
            e.Property(x => x.PasswordHash).IsRequired();
            e.Property(x => x.Position).HasMaxLength(200);
            e.Property(x => x.Phone).HasMaxLength(50);
            e.Property(x => x.JoinDate).HasMaxLength(50);
            e.Property(x => x.AvatarBlobName).HasMaxLength(500);
            e.Property(x => x.UseAiEvaluation).HasDefaultValue(false);
            e.Property(x => x.GoogleId).HasMaxLength(100);
            e.Property(x => x.FacebookId).HasMaxLength(100);
            e.Property(x => x.PreferredLanguage).IsRequired().HasMaxLength(10).HasDefaultValue("hu");
            e.HasIndex(x => x.Email).IsUnique();
            e.HasIndex(x => x.GoogleId).IsUnique().HasFilter("[GoogleId] IS NOT NULL");
            e.HasIndex(x => x.FacebookId).IsUnique().HasFilter("[FacebookId] IS NOT NULL");
        });
    }
}
