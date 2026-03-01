using GaziStudyAI.Domain.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GaziStudyAI.Infrastructure.Mapping
{
    public class CourseMapping : IEntityTypeConfiguration<Course>
    {
        public void Configure(EntityTypeBuilder<Course> builder)
        {
            builder.ToTable("Courses");
            builder.HasKey(c => c.Id);

            builder.Property(c => c.NameTr).IsRequired().HasMaxLength(150);
            builder.Property(c => c.NameEn).IsRequired().HasMaxLength(150);

            builder.Property(c => c.DescriptionTr).HasMaxLength(2000);
            builder.Property(c => c.DescriptionEn).HasMaxLength(2000);

            builder.Property(c => c.TeacherName).HasMaxLength(100);

            // YearLevel usually between 1 and 4
            builder.Property(c => c.YearLevel).IsRequired();

            builder.HasMany(c => c.Weeks)
                   .WithOne(cw => cw.Course)
                   .HasForeignKey(cw => cw.CourseId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
