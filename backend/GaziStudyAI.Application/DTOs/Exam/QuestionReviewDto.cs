namespace GaziStudyAI.Application.DTOs.Exam
{
    public class QuestionReviewDto
    {
        public Guid Id { get; set; }
        public string Text { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "MultipleChoice" or "vp_code_completion", etc.
        public string? OptionA { get; set; }
        public string? OptionB { get; set; }
        public string? OptionC { get; set; }
        public string? OptionD { get; set; }
        public string CorrectAnswer { get; set; } = string.Empty;
        public string StudentAnswer { get; set; } = string.Empty;
        public bool IsCorrect { get; set; }

        // For Classic Exams
        public string? InputDataJson { get; set; }
        public string? SolutionJson { get; set; }
    }
}
