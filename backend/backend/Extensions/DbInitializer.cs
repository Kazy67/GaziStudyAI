using GaziStudyAI.Domain.Entities.Auth;
using GaziStudyAI.Domain.Enums;
using GaziStudyAI.Infrastructure.Context;
using Microsoft.EntityFrameworkCore;
using System.Security.Cryptography;
using System.Text;

namespace GaziStudyAI.WebAPI.Extensions
{
    public class DbInitializer
    {
        public static async Task SeedAdminUserAsync(IServiceProvider serviceProvider, IConfiguration configuration)
        {
            using var scope = serviceProvider.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<GaziStudyAIDbContext>();

            // Apply any pending migrations automatically
            await context.Database.MigrateAsync();

            // Check if admin already exists
            if (!await context.Users.AnyAsync(u => u.Role == UserRole.Admin))
            {
                var adminPassword = configuration["AdminSettings:DefaultPassword"] ?? "FallbackAdmin123!";
                using var hmac = new HMACSHA512();
                var adminUser = new User
                {
                    FirstName = "Kazybek",
                    LastName = "Kulmatov",
                    Email = "kazybekkulmatov67@gmail.com", // Change to your actual email
                    Role = UserRole.Admin,
                    IsEmailVerified = true,
                    IsActive = true,
                    PasswordSalt = hmac.Key,
                    PasswordHash = hmac.ComputeHash(Encoding.UTF8.GetBytes(adminPassword)), // Default password
                    CreatedDate = DateTime.UtcNow,
                    CreatedBy = Guid.Empty // System created
                };

                await context.Users.AddAsync(adminUser);
                await context.SaveChangesAsync();
            }
        }
    }
}
