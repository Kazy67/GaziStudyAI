using GaziStudyAI.Application.DTOs.Exam;
using GaziStudyAI.Application.DTOs.Student;
using GaziStudyAI.Common.Result.Abstract;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface IAIExamService
    {
        Task<IResult<List<GeneratedClassicQuestionDto>>> GenerateClassicExamAsync(GenerateClassicRequestDto request);
        Task<IResult<EvaluationResultDto>> EvaluateClassicQuestionAsync(EvaluateClassicQuestionDto request);
        Task<IResult<Guid>> SaveExamResultAsync(Guid userId, SubmitExamDto request);
        Task<IResult<StudentDashboardDto>> GetStudentDashboardAsync(Guid userId);
    }
}
