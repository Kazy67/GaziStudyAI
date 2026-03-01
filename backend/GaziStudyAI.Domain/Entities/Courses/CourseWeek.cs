using GaziStudyAI.Common.Entities;

namespace GaziStudyAI.Domain.Entities.Courses
{
    public class CourseWeek : BaseEntity
    {
        public Guid CourseId { get; set; }
        public virtual Course Course { get; set; } = null!;

        public int WeekNumber { get; set; } // 1, 2, 3... up to 14

        public string TopicTr { get; set; } = string.Empty; // e.g., "Süreç Yönetimi"
        public string TopicEn { get; set; } = string.Empty; // e.g., "Process Management"
    }
}

