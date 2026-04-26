namespace GaziStudyAI.Application.DTOs.Student
{
    public class CoursePerformanceDto
    {
        public Guid CourseId { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public decimal AverageScore { get; set; }
        public int ExamsTaken { get; set; }
    }
}
