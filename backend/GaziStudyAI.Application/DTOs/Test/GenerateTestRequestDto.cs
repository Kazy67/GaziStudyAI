namespace GaziStudyAI.Application.DTOs.Test
{
    public class GenerateTestRequestDto
    {
        public string CoursePrefix { get; set; } = string.Empty; // "os" or "vp"
        public List<int> Weeks { get; set; } = new List<int>(); // [1, 2, 3]
        public int QuestionCount { get; set; }
        public string Difficulty { get; set; } = string.Empty; // "Easy", "Medium", "Hard"
    }
}
