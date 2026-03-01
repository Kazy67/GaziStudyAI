using GaziStudyAI.Common.Entities;
using GaziStudyAI.Domain.Entities.Auth;
using GaziStudyAI.Domain.Entities.Courses;
using GaziStudyAI.Domain.Enums;

namespace GaziStudyAI.Domain.Entities.Exams
{
    public class Exam : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid CourseId { get; set; }

        public string? Topic { get; set; } = string.Empty; // "Hafta 1-5" or "Cpu Scheduling"

        public int QuestionCount { get; set; }
        public double? Score { get; set; } // 0 to 100
        public bool IsCompleted { get; set; } = false;

        public DifficultyLevel Difficulty { get; set; } = DifficultyLevel.Medium;

        // Navigation
        public virtual User User { get; set; } = null!;
        public virtual Course Course { get; set; } = null!;
        public virtual ICollection<Question> Questions { get; set; } = new List<Question>();
    }
}
