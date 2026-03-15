namespace GaziStudyAI.Application.DTOs.Student
{
    public class ExamHistoryDto
    {
        public Guid ExamId { get; set; }
        public string CourseNameEn { get; set; }
        public string CourseNameTr { get; set; }
        public string Topic { get; set; }
        public double Score { get; set; }
        public DateTime CreatedDate { get; set; }

        public int AttemptNumber { get; set; }
        public int QuestionCount { get; set; }
        public string Difficulty { get; set; } = string.Empty;
    }
}
