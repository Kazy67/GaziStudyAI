namespace GaziStudyAI.Application.DTOs.Exam
{
    public class SubmitExamDto
    {
        public Guid CourseId { get; set; }
        public Guid SessionId { get; set; } // From Angular
        public int AttemptNumber { get; set; } // From Angular

        public string Topic { get; set; } = string.Empty;
        public int QuestionCount { get; set; }
        public double Score { get; set; }
        public string Difficulty { get; set; } = "Medium";

        public List<SubmitQuestionDto> Questions { get; set; } = new();
    }
}
