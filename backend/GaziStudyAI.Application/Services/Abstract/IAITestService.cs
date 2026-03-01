using GaziStudyAI.Application.DTOs.Test;
using GaziStudyAI.Common.Result.Abstract;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface IAITestService
    {
        Task<IResult<List<GeneratedQuestionDto>>> GenerateMultipleChoiceExamAsync(GenerateTestRequestDto request);
    }
}
