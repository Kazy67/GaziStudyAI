namespace GaziStudyAI.Application.DTOs.Exam
{
    // What Angular sends to C#
    public class GenerateClassicRequestDto
    {
        public string CoursePrefix { get; set; } = string.Empty; // "os", "vp", etc.
        public List<int> Weeks { get; set; } = new List<int>();
        public int QuestionCount { get; set; } // Max 5
        public string Difficulty { get; set; } = string.Empty; // "easy", "medium", "hard"
    }
}
