using GaziStudyAI.Domain.Entities.Exams;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GaziStudyAI.Infrastructure.Mapping
{
    public class QuestionMapping : IEntityTypeConfiguration<Question>
    {
        public void Configure(EntityTypeBuilder<Question> builder)
        {
            builder.ToTable("Questions");
            builder.HasKey(q => q.Id);

            builder.Property(q => q.Text).IsRequired(); // No max length, questions can be long

            // Store JSON data as nvarchar(MAX)
            builder.Property(q => q.InputDataJson).HasColumnType("nvarchar(max)");
            builder.Property(q => q.SolutionJson).HasColumnType("nvarchar(max)");
        }
    }
}
