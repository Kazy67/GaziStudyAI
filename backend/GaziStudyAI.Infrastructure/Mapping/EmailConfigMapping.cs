using GaziStudyAI.Domain.Entities.System;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GaziStudyAI.Infrastructure.Mapping
{
    public class EmailConfigMapping : IEntityTypeConfiguration<EmailConfiguration>
    {
        public void Configure(EntityTypeBuilder<EmailConfiguration> builder)
        {
            builder.ToTable("EmailConfiguration");
            builder.HasKey(x => x.Id);

            // Seed Default Gmail Config (Optional, saves time)
            builder.HasData(new EmailConfiguration
            {
                Id = Guid.NewGuid(),
                SmtpServer = "smtp.gmail.com",
                Port = 587,
                SenderEmail = "gazistudyai.project@gmail.com",
                SenderPassword = "bonxwdxcmxywmqcx",
                EnableSsl = true,
                CreatedDate = DateTime.UtcNow,
                IsActive = true
            });
        }
    }
}
