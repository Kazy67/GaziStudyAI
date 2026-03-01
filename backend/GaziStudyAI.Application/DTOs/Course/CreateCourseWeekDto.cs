namespace GaziStudyAI.Application.DTOs.Course
{
    public class CreateCourseWeekDto
    {
        public int WeekNumber { get; set; }
        public string TopicTr { get; set; } = string.Empty;
        public string TopicEn { get; set; } = string.Empty;
    }
}
