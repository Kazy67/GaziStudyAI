namespace GaziStudyAI.Application.DTOs.Exam
{
    public class PythonEvaluationResponse
    {
        public bool Success { get; set; }
        public EvaluationResultDto Data { get; set; }
        public string Error { get; set; }
    }
}
