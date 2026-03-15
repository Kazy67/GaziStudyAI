namespace GaziStudyAI.Application.DTOs.Student
{
    public class StudentDashboardDto
    {
        public int TotalExamsTaken { get; set; }
        public double AverageScore { get; set; }
        public List<ExamHistoryDto> RecentExams { get; set; } = new();
    }
}
