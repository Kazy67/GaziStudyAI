using GaziStudyAI.Common.Entities;
using GaziStudyAI.Domain.Entities.Auth;
using GaziStudyAI.Domain.Entities.Courses;
using GaziStudyAI.Domain.Entities.Exams;
using GaziStudyAI.Domain.Entities.System;
using GaziStudyAI.Infrastructure.Mapping;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using Microsoft.Extensions.Logging;

namespace GaziStudyAI.Infrastructure.Context
{
    public class GaziStudyAIDbContext : DbContext
    {
        private readonly IHttpContextAccessor? _httpContextAccessor;

        public GaziStudyAIDbContext(DbContextOptions<GaziStudyAIDbContext> options, IHttpContextAccessor? httpContextAccessor = null)
        : base(options)
        {
            _httpContextAccessor = httpContextAccessor;
        }

        public DbSet<User> Users { get; set; }
        public DbSet<UserSettings> UserSettings { get; set; }

        // Exams
        public DbSet<Exam> Exams { get; set; }
        public DbSet<Question> Questions { get; set; }

        // System
        public DbSet<EmailConfiguration> EmailConfigurations { get; set; }

        // Courses

        public DbSet<Course> Courses { get; set; }

        public DbSet<StudentCourse> StudentCourses { get; set; }
        public DbSet<CourseWeek> CourseWeeks { get; set; }

        protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
        {
            optionsBuilder.ConfigureWarnings(warnings =>
            warnings.Ignore(RelationalEventId.PendingModelChangesWarning));
            // Disable tracking for read-heavy apps (Performance boost)
            optionsBuilder.UseQueryTrackingBehavior(QueryTrackingBehavior.NoTracking);

            // Simple logging for development
            if (Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") == "Development")
            {
                optionsBuilder.EnableSensitiveDataLogging();
                optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information);
            }
        }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Apply Configurations manually (Cleaner than writing all here)
            modelBuilder.ApplyConfiguration(new UserMapping());
            modelBuilder.ApplyConfiguration(new UserSettingsMapping());
            modelBuilder.ApplyConfiguration(new ExamMapping());
            modelBuilder.ApplyConfiguration(new QuestionMapping());
            modelBuilder.ApplyConfiguration(new EmailConfigMapping());
            modelBuilder.ApplyConfiguration(new CourseMapping());
            modelBuilder.ApplyConfiguration(new StudentCourseMapping());
            modelBuilder.ApplyConfiguration(new CourseWeekMapping());
        }

        // --- AUDIT LOGIC (Keep this!) ---
        private Guid? GetCurrentUserId()
        {
            // We will implement JWT reading later, for now return null or a system user
            var context = _httpContextAccessor?.HttpContext;
            if (context?.Items["UserId"] != null)
            {
                return context.Items["UserId"] as Guid?;
            }
            return null;
        }

        private void SetAuditFields()
        {
            var currentUserId = GetCurrentUserId();
            var entries = ChangeTracker.Entries<BaseEntity>();

            foreach (var entry in entries)
            {
                switch (entry.State)
                {
                    case EntityState.Added:
                        entry.Entity.CreatedDate = DateTime.UtcNow;
                        entry.Entity.CreatedBy = currentUserId;
                        entry.Entity.IsActive = true;
                        break;

                    case EntityState.Modified:
                        entry.Entity.UpdatedDate = DateTime.UtcNow;
                        entry.Entity.UpdatedBy = currentUserId;
                        break;

                    case EntityState.Deleted:
                        // SOFT DELETE
                        entry.State = EntityState.Modified;
                        entry.Entity.DeletedDate = DateTime.UtcNow;
                        entry.Entity.DeletedBy = currentUserId;
                        entry.Entity.IsActive = false;
                        break;
                }
            }
        }

        public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            SetAuditFields();
            return base.SaveChangesAsync(cancellationToken);
        }
    }
}
