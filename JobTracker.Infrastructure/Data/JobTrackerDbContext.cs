using JobTracker.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace JobTracker.Infrastructure.Data;

public sealed class JobTrackerDbContext(DbContextOptions<JobTrackerDbContext> options)
    : DbContext(options)
{
    public DbSet<Job> Jobs => Set<Job>();
    public DbSet<CalendarEvent> CalendarEvents => Set<CalendarEvent>();
    public DbSet<PlannerTask> PlannerTasks => Set<PlannerTask>();
    public DbSet<UserDocument> UserDocuments => Set<UserDocument>();
    public DbSet<EventType> EventTypes => Set<EventType>();
    public DbSet<JobStatusConfig> JobStatusConfigs => Set<JobStatusConfig>();
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
        });

        builder.Entity<CalendarEvent>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).IsRequired().HasMaxLength(100);
            e.Property(x => x.Company).IsRequired().HasMaxLength(200);
            e.Property(x => x.Date).IsRequired().HasMaxLength(10);
            e.Property(x => x.Time).IsRequired().HasMaxLength(5);
            e.Property(x => x.Notes).HasMaxLength(1000);
        });

        builder.Entity<PlannerTask>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Text).IsRequired().HasMaxLength(500);
        });

        builder.Entity<UserDocument>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(200);
            e.Property(x => x.Type).IsRequired().HasMaxLength(100);
            e.Property(x => x.Updated).IsRequired().HasMaxLength(10);
            e.Property(x => x.Version).IsRequired().HasMaxLength(50);
        });

        builder.Entity<EventType>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).IsRequired().HasMaxLength(100);
            e.HasIndex(x => x.Name).IsUnique();
        });

        builder.Entity<JobStatusConfig>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Key).IsRequired().HasMaxLength(50);
            e.Property(x => x.Label).IsRequired().HasMaxLength(100);
            e.Property(x => x.Color).IsRequired().HasMaxLength(20);
            e.HasIndex(x => x.Key).IsUnique();
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
            e.HasIndex(x => x.Email).IsUnique();
        });
    }
}
