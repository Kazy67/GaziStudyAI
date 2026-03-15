namespace GaziStudyAI.Application.DTOs.Admin
{
    public class AdminDashboardDto
    {
        public int TotalStudents { get; set; }
        public int TotalExamsGenerated { get; set; }
        public double AveragePlatformScore { get; set; }
        public List<CourseStatsDto> CourseStatistics { get; set; } = new();
        public List<TopStudentDto> TopStudents { get; set; } = new();
    }
}
