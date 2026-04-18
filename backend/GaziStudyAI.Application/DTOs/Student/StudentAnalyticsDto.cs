namespace GaziStudyAI.Application.DTOs.Student
{
    public class StudentAnalyticsDto
    {
        public int TotalExamsTaken { get; set; }
        public decimal OverallAverageScore { get; set; }

        // For a Bar/Radar Chart (Average score per course)
        public List<CoursePerformanceDto> CoursePerformances { get; set; } = new List<CoursePerformanceDto>();

        // For a Line Chart (Scores over time)
        public List<ScoreTimelineDto> ScoreTimeline { get; set; } = new List<ScoreTimelineDto>();
    }
}
