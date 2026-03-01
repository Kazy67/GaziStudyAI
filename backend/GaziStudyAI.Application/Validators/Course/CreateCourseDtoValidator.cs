using FluentValidation;
using GaziStudyAI.Application.DTOs.Course;

namespace GaziStudyAI.Application.Validators.Course
{
    public class CreateCourseDtoValidator : AbstractValidator<CreateCourseDto>
    {
        public CreateCourseDtoValidator()
        {
            RuleFor(x => x.NameTr).NotEmpty().MaximumLength(150);
            RuleFor(x => x.NameEn).NotEmpty().MaximumLength(150);

            RuleFor(x => x.YearLevel)
                .InclusiveBetween(1, 4).WithMessage("Year level must be between 1 and 4.");

            RuleFor(x => x.Credits)
                .GreaterThan(0).When(x => x.Credits.HasValue).WithMessage("Credits must be greater than 0.");
        }
    }
}
