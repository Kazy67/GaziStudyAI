using GaziStudyAI.Common.Entities;
using GaziStudyAI.Domain.Entities.Auth;

namespace GaziStudyAI.Domain.Entities.Courses
{
    public class StudentCourse : BaseEntity
    {
        public Guid UserId { get; set; }
        public virtual User User { get; set; } = null!;

        public Guid CourseId { get; set; }
        public virtual Course Course { get; set; } = null!;

        // Admin Panel Details
        public string Semester { get; set; } = string.Empty; // e.g., "Fall 2025"
        public DateTime EnrollmentDate { get; set; } = DateTime.UtcNow;

        // "Active", "Completed", or "Dropped"
        public string Status { get; set; } = "Active";
    }
}
