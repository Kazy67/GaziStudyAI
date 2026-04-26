using GaziStudyAI.Application.DTOs.Test;

namespace GaziStudyAI.Application.DTOs.Exam
{
    public class MockExamResultDto
    {
        public List<GeneratedQuestionDto> TestQuestions { get; set; } = new List<GeneratedQuestionDto>();
        public List<GeneratedClassicQuestionDto> ClassicQuestions { get; set; } = new List<GeneratedClassicQuestionDto>();
    }
}
