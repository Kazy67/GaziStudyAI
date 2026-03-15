using System.Collections.Generic;

namespace GaziStudyAI.Application.DTOs.Exam
{
    public class EvaluationResultDto
    {
        public int Score { get; set; }
        public List<string> Feedback { get; set; }
    }
}
