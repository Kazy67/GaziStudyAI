using GaziStudyAI.Common.Entities;
using GaziStudyAI.Domain.Entities.Courses;
using GaziStudyAI.Domain.Entities.Exams;
using GaziStudyAI.Domain.Enums;

namespace GaziStudyAI.Domain.Entities.Auth
{
    public class User : BaseEntity
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;

        // Gazi Specifics
        public string? StudentNumber { get; set; } // e.g., "191180055"
        public string? Department { get; set; } // e.g., "Computer Engineering"

        // Security
        public byte[] PasswordHash { get; set; } = Array.Empty<byte>();
        public byte[] PasswordSalt { get; set; } = Array.Empty<byte>();
        public bool IsEmailVerified { get; set; } = false;
        public string? EmailVerificationCode { get; set; } // We will generate a random code here
        public string? PasswordResetCode { get; set; }
        public string? ProfileImageUrl { get; set; }
        public UserRole Role { get; set; } = UserRole.Student; // Simple Enum!

        // Navigation
        public virtual ICollection<Exam> Exams { get; set; } = new List<Exam>();
        public virtual ICollection<StudentCourse> StudentCourses { get; set; } = new List<StudentCourse>();
    }
}
