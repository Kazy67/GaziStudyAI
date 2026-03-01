using FluentValidation;
using GaziStudyAI.Application.DTOs.Auth;

namespace GaziStudyAI.Application.Validators.Auth
{
    public class RegisterDtoValidator : AbstractValidator<RegisterDto>
    {
        public RegisterDtoValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty().WithMessage("Email is required")
                .EmailAddress().WithMessage("Invalid email format")
                .Must(e => e.EndsWith("@gazi.edu.tr") || e.EndsWith("@gmail.com")) // Optional rule
                .WithMessage("Only Gazi or Gmail addresses are allowed.");

            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(6).WithMessage("Password must be at least 6 characters.");

            RuleFor(x => x.FirstName).NotEmpty().MaximumLength(50);
            RuleFor(x => x.LastName).NotEmpty().MaximumLength(50);
        }
    }
}
