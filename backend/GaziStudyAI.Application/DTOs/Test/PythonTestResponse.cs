namespace GaziStudyAI.Application.DTOs.Test
{
    public class PythonTestResponse
    {
        public bool Success { get; set; }
        public string? Error { get; set; }
        public List<GeneratedQuestionDto>? Data { get; set; }
    }
}
