using GaziStudyAI.Application.DTOs.Exam;
using GaziStudyAI.Common.Result.Abstract;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface IAIExamService
    {
        Task<IResult<List<GeneratedClassicQuestionDto>>> GenerateClassicExamAsync(GenerateClassicRequestDto request);
    }
}
