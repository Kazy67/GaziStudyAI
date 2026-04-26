namespace GaziStudyAI.Application.DTOs.Course
{
    public class CourseAverageScoreDto
    {
        public string CourseNameTr { get; set; } = string.Empty;
        public string CourseNameEn { get; set; } = string.Empty;
        public decimal AverageScore { get; set; }
    }
}
