namespace GaziStudyAI.Application.DTOs.Exam
{
    public class EvaluateClassicQuestionDto
    {
        public string VisualType { get; set; }
        public string QuestionText { get; set; }
        public object SolutionData { get; set; }
        public object StudentData { get; set; }
    }
}
