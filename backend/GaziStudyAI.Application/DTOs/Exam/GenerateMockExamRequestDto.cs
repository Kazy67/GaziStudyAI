namespace GaziStudyAI.Application.DTOs.Exam
{
    public class GenerateMockExamRequestDto
    {
        public Guid CourseId { get; set; }
        public string ExamType { get; set; } = string.Empty; // "Vize" or "Final"
    }

}
