namespace GaziStudyAI.Application.DTOs.Exam
{
    // What C# receives from Python
    public class PythonClassicResponse
    {
        public bool Success { get; set; }
        public string? Error { get; set; }
        public List<GeneratedClassicQuestionDto>? Data { get; set; }
    }
}
