using FluentValidation;
using GaziStudyAI.Application.DTOs.User;

namespace GaziStudyAI.Application.Validators.User
{
    public class UpdateProfileDtoValidator : AbstractValidator<UpdateProfileDto>
    {
        public UpdateProfileDtoValidator()
        {
            RuleFor(x => x.FirstName)
                .NotEmpty().WithMessage("First name is required.")
                .MaximumLength(50);

            RuleFor(x => x.LastName)
                .NotEmpty().WithMessage("Last name is required.")
                .MaximumLength(50);

            RuleFor(x => x.StudentNumber)
                .MaximumLength(20).When(x => !string.IsNullOrEmpty(x.StudentNumber));

            RuleFor(x => x.Department)
                .MaximumLength(100).When(x => !string.IsNullOrEmpty(x.Department));

        }
    }
}
