namespace GaziStudyAI.Application.DTOs.Student
{
    public class ScoreTimelineDto
    {
        public DateTime ExamDate { get; set; }
        public decimal Score { get; set; }
        public string CoursePrefix { get; set; } = string.Empty;
    }
}
