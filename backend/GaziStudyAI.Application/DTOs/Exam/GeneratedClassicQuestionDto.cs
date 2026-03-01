using System.Text.Json;

namespace GaziStudyAI.Application.DTOs.Exam
{
    // The magical dynamic DTO
    public class GeneratedClassicQuestionDto
    {
        public string VisualType { get; set; } = string.Empty; // e.g., "cpu_scheduling", "page_replacement"
        public string QuestionText { get; set; } = string.Empty;

        // JsonElement allows C# to hold ANY object without crashing!
        public JsonElement InputData { get; set; }
        public JsonElement SolutionData { get; set; }
    }
}
