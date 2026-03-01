using GaziStudyAI.Domain.Entities.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace GaziStudyAI.Infrastructure.Mapping
{
    public class UserSettingsMapping : IEntityTypeConfiguration<UserSettings>
    {
        public void Configure(EntityTypeBuilder<UserSettings> builder)
        {
            builder.ToTable("UserSettings");
            builder.HasKey(x => x.Id);

            // Defaults
            builder.Property(x => x.Language).HasMaxLength(10).HasDefaultValue("tr-TR");
            builder.Property(x => x.IsDarkMode).HasDefaultValue(false);

            // RELATIONSHIP: One-to-One
            // A User has one UserSettings, and UserSettings belongs to one User.
            builder.HasOne(x => x.User)
                   .WithOne() // User doesn't explicitly need a navigation property back to settings, or you can add it to User entity
                   .HasForeignKey<UserSettings>(x => x.UserId)
                   .OnDelete(DeleteBehavior.Cascade); // If User is deleted, delete their settings
        }
    }
}
