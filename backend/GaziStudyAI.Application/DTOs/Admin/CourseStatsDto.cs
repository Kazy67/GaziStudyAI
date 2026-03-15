namespace GaziStudyAI.Application.DTOs.Admin
{
    public class CourseStatsDto
    {
        public string CourseName { get; set; } = string.Empty;
        public int ExamsTaken { get; set; }
        public double AverageScore { get; set; }
    }
}
