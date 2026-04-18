namespace GaziStudyAI.Application.DTOs.Exam
{
    public class ExamHistoryItemDto
    {
        public Guid Id { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public string CoursePrefix { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public decimal Score { get; set; }
        public string Difficulty { get; set; } = string.Empty;
        public int TotalQuestions { get; set; }
        public string ExamType { get; set; } = string.Empty;
    }
}
