using FluentValidation;
using GaziStudyAI.Application.DTOs.Exam;

namespace GaziStudyAI.Application.Validators.Exam
{
    public class SubmitExamDtoValidator : AbstractValidator<SubmitExamDto>
    {
        public SubmitExamDtoValidator()
        {
            RuleFor(x => x.CourseId).NotEmpty().WithMessage("CourseId is required.");
            RuleFor(x => x.SessionId).NotEmpty().WithMessage("SessionId is required.");
            RuleFor(x => x.QuestionCount).GreaterThan(0);
            RuleFor(x => x.Questions).NotEmpty().WithMessage("An exam must have questions.");
        }
    }
}
