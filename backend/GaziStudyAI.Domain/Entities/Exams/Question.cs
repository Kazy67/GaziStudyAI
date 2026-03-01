using GaziStudyAI.Common.Entities;
using GaziStudyAI.Domain.Enums;

namespace GaziStudyAI.Domain.Entities.Exams
{
    public class Question : BaseEntity
    {
        public Guid ExamId { get; set; }

        public string Text { get; set; } = string.Empty; // "What is a Deadlock?"

        public QuestionType Type { get; set; } // MultipleChoice, Classic

        // For Multiple Choice
        public string? OptionA { get; set; }
        public string? OptionB { get; set; }
        public string? OptionC { get; set; }
        public string? OptionD { get; set; }
        public string? CorrectAnswer { get; set; } // e.g. "A" or the full text

        // For Classic (The JSON Data from AI)
        public string? InputDataJson { get; set; } // The table data for FCFS
        public string? SolutionJson { get; set; }  // The Gantt chart answer key

        // Student's Answer
        public string? StudentAnswer { get; set; }
        public bool IsCorrect { get; set; }

        public virtual Exam Exam { get; set; } = null!;
    }
}
