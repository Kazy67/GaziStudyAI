using GaziStudyAI.Domain.Entities.Courses;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GaziStudyAI.Infrastructure.Mapping
{
    public class CourseWeekMapping : IEntityTypeConfiguration<CourseWeek>
    {
        public void Configure(EntityTypeBuilder<CourseWeek> builder)
        {
            builder.ToTable("CourseWeeks");
            builder.HasKey(cw => cw.Id);

            builder.Property(cw => cw.WeekNumber).IsRequired();
            builder.Property(cw => cw.TopicTr).IsRequired().HasMaxLength(250);
            builder.Property(cw => cw.TopicEn).IsRequired().HasMaxLength(250);
        }
    }
}
