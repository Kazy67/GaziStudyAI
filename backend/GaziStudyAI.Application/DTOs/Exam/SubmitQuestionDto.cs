using GaziStudyAI.Domain.Enums;

namespace GaziStudyAI.Application.DTOs.Exam
{
    public class SubmitQuestionDto
    {
        public string Text { get; set; } = string.Empty;
        public QuestionType Type { get; set; }
        public string? StudentAnswer { get; set; }
        public bool IsCorrect { get; set; }

        // Save the AI JSON so admins can see exactly what the AI asked!
        public string? InputDataJson { get; set; }
        public string? SolutionJson { get; set; }
    }
}
