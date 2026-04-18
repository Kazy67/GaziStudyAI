namespace GaziStudyAI.Application.DTOs.Exam
{
    public class ExamReviewDetailDto
    {
        public Guid Id { get; set; }
        public string CourseName { get; set; } = string.Empty;
        public DateTime CreatedDate { get; set; }
        public decimal Score { get; set; }
        public string Difficulty { get; set; } = string.Empty;
        public List<QuestionReviewDto> Questions { get; set; } = new List<QuestionReviewDto>();
    }
}
