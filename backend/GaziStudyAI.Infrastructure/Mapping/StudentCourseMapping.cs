using GaziStudyAI.Domain.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GaziStudyAI.Infrastructure.Mapping
{
    public class StudentCourseMapping : IEntityTypeConfiguration<StudentCourse>
    {
        public void Configure(EntityTypeBuilder<StudentCourse> builder)
        {
            builder.ToTable("StudentCourses");
            builder.HasKey(sc => sc.Id);

            builder.Property(sc => sc.Semester).IsRequired().HasMaxLength(50);
            builder.Property(sc => sc.Status).HasMaxLength(20);

            // Relationship to User
            builder.HasOne(sc => sc.User)
                   .WithMany(u => u.StudentCourses)
                   .HasForeignKey(sc => sc.UserId)
                   .OnDelete(DeleteBehavior.Cascade); // If user is deleted, delete enrollment

            // Relationship to Course
            builder.HasOne(sc => sc.Course)
                   .WithMany(c => c.StudentCourses)
                   .HasForeignKey(sc => sc.CourseId)
                   .OnDelete(DeleteBehavior.Cascade); // If course is deleted, delete enrollment
        }
    }
}
