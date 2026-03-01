using AutoMapper;
using FluentValidation;
using GaziStudyAI.Application.DTOs.Auth;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Helpers;
using GaziStudyAI.Common.Result.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using GaziStudyAI.Domain.Entities.Auth;
using GaziStudyAI.Infrastructure.Services;
using GaziStudyAI.Infrastructure.UnitOfWork.Abstract;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class AuthService : IAuthService
    {
        private readonly IUnitOfWork _uow;
        private readonly ITokenService _tokenService;
        private readonly IMapper _mapper;
        private readonly IValidator<RegisterDto> _registerValidator;
        private readonly IEmailService _emailService;

        public AuthService(
            IUnitOfWork uow,
            ITokenService tokenService,
            IMapper mapper,
            IValidator<RegisterDto> registerValidator,
            IEmailService emailService)
        {
            _uow = uow;
            _tokenService = tokenService;
            _mapper = mapper;
            _registerValidator = registerValidator;
            _emailService = emailService;
        }

        public async Task<IResult<AuthResponseDto>> RegisterAsync(RegisterDto request)
        {
            // 1. VALIDATION
            var validationResult = await _registerValidator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return ServiceResult<AuthResponseDto>.Failure("Validation failed", "VALIDATION_FAILED", errors);
            }

            var existingUser = await _uow.UserRepository.GetByEmailAsync(request.Email);

            // 👇 SMART LOGIC START 👇
            if (existingUser != null)
            {
                // Case A: User is already verified -> Block them
                if (existingUser.IsEmailVerified)
                {
                    return ServiceResult<AuthResponseDto>.Failure("Email already exists.", "EMAIL_ALREADY_EXISTS");
                }

                // Case B: User exists but NEVER verified -> Overwrite them!
                // We act like this is a fresh registration for them.
                SecurityHelper.CreatePasswordHash(request.Password, out byte[] newHash, out byte[] newSalt);
                existingUser.PasswordHash = newHash;
                existingUser.PasswordSalt = newSalt;
                existingUser.FirstName = request.FirstName;
                existingUser.LastName = request.LastName;

                var newCode = new Random().Next(100000, 999999).ToString();
                existingUser.EmailVerificationCode = newCode;

                _uow.UserRepository.Update(existingUser);
                await _uow.SaveChangesAsync();

                var newEmailBody = $"<h3>Welcome Back!</h3><p>Your new verification code is: <b>{newCode}</b></p>";
                await _emailService.SendEmailAsync(existingUser.Email, "Verify your Account", newEmailBody);

                var response = _mapper.Map<AuthResponseDto>(existingUser);
                response.Token = "";
                return ServiceResult<AuthResponseDto>.Success(response, "Registration restarted. Check your email for the new code.", "REGISTRATION_RESTARTED");
            }

            // 3. MAP DTO -> ENTITY
            var user = _mapper.Map<User>(request);

            // 4. SECURITY & VERIFICATION
            SecurityHelper.CreatePasswordHash(request.Password, out byte[] hash, out byte[] salt);
            user.PasswordHash = hash;
            user.PasswordSalt = salt;

            // Generate 6-digit code
            var code = new Random().Next(100000, 999999).ToString();
            user.EmailVerificationCode = code;
            user.IsEmailVerified = false;

            // 5. SAVE
            await _uow.UserRepository.AddAsync(user);
            await _uow.SaveChangesAsync();

            // 6. SEND EMAIL
            var emailBody = $"<h3>Welcome to GaziStudyAI!</h3><p>Your verification code is: <b>{code}</b></p>";
            await _emailService.SendEmailAsync(user.Email, "Verify your Account", emailBody);

            // 7. RETURN RESPONSE
            var responseDto = _mapper.Map<AuthResponseDto>(user);
            responseDto.Token = ""; // No token until verified

            return ServiceResult<AuthResponseDto>.Success(responseDto, "Registration successful. Please check your email for the verification code.", "REGISTRATION_SUCCESSFUL");
        }

        public async Task<IResult<AuthResponseDto>> LoginAsync(LoginDto request)
        {
            var user = await _uow.UserRepository.GetByEmailAsync(request.Email);
            if (user == null) return ServiceResult<AuthResponseDto>.Failure("User not found.", "USER_NOT_FOUND");

            if (!SecurityHelper.VerifyPasswordHash(request.Password, user.PasswordHash, user.PasswordSalt))
                return ServiceResult<AuthResponseDto>.Failure("Invalid password.", "INVALID_PASSWORD");

            // Check Verification
            if (!user.IsEmailVerified)
                return ServiceResult<AuthResponseDto>.Failure("Please verify your email first.", "EMAIL_NOT_VERIFIED");

            var token = _tokenService.GenerateToken(user);
            var responseDto = _mapper.Map<AuthResponseDto>(user);
            responseDto.Token = token;

            return ServiceResult<AuthResponseDto>.Success(responseDto, "Login successful.", "LOGIN_SUCCESSFUL");
        }

        public async Task<IResult> VerifyEmailAsync(VerifyEmailDto request)
        {
            var user = await _uow.UserRepository.GetByEmailAsync(request.Email);
            if (user == null) return ServiceResult.Failure("User not found.", "USER_NOT_FOUND");

            if (user.IsEmailVerified) return ServiceResult.Failure("User already verified.", "USER_ALREADY_VERIFIED");

            if (user.EmailVerificationCode != request.Code)
                return ServiceResult.Failure("Invalid verification code.", "INVALID_VERIFICATION_CODE");

            // SUCCESS LOGIC
            user.IsEmailVerified = true;
            user.EmailVerificationCode = null; // Clear code

            // 👇 CRITICAL FIX: Explicitly update the user state in EF Core
            _uow.UserRepository.Update(user);

            await _uow.SaveChangesAsync();

            return ServiceResult.Success("Email verified successfully! You can now login.", "EMAIL_VERIFIED_SUCCESSFUL");
        }

        public async Task<IResult> ResendVerificationCodeAsync(ResendVerificationDto request)
        {
            var user = await _uow.UserRepository.GetByEmailAsync(request.Email);

            // 1. Security Checks
            if (user == null)
                return ServiceResult.Failure("User not found.", "USER_NOT_FOUND");

            if (user.IsEmailVerified)
                return ServiceResult.Failure("User is already verified. Please login.", "USER_ALREADY_VERIFIED");

            // 2. Generate NEW Code
            var newCode = new Random().Next(100000, 999999).ToString();
            user.EmailVerificationCode = newCode;

            // 3. Update User in DB
            _uow.UserRepository.Update(user); // Important!
            await _uow.SaveChangesAsync();

            // 4. Send Email
            var emailBody = $"<h3>GaziStudyAI</h3><p>Your new verification code is: <b>{newCode}</b></p>";
            await _emailService.SendEmailAsync(user.Email, "Resend: Verify your Account", emailBody);

            return ServiceResult.Success("Verification code resent successfully.", "VERIFICATION_CODE_RESENT");
        }

        public async Task<IResult> ForgotPasswordAsync(ForgotPasswordDto request)
        {
            var user = await _uow.UserRepository.GetByEmailAsync(request.Email);

            // 1. Security Checks
            if (user == null)
                return ServiceResult.Failure("User not found.", "USER_NOT_FOUND");

            if (!user.IsEmailVerified)
                return ServiceResult.Failure("Please verify your email before resetting your password.", "EMAIL_NOT_VERIFIED");

            // 2. Generate Reset Code
            var resetCode = new Random().Next(100000, 999999).ToString();
            user.PasswordResetCode = resetCode;

            // 3. Save to DB
            _uow.UserRepository.Update(user);
            await _uow.SaveChangesAsync();

            // 4. Send Email
            var emailBody = $"<h3>Password Reset Request</h3><p>Your password reset code is: <b>{resetCode}</b></p>";
            await _emailService.SendEmailAsync(user.Email, "Reset Your Password", emailBody);

            return ServiceResult.Success("Password reset code sent to your email.", "PASSWORD_RESET_CODE_SENT");
        }

        public async Task<IResult> ResetPasswordAsync(ResetPasswordDto request)
        {
            var user = await _uow.UserRepository.GetByEmailAsync(request.Email);
            if (user == null)
                return ServiceResult.Failure("User not found.", "USER_NOT_FOUND");

            // 1. Verify Code
            if (string.IsNullOrEmpty(user.PasswordResetCode) || user.PasswordResetCode != request.Code)
                return ServiceResult.Failure("Invalid or expired reset code.", "INVALID_RESET_CODE");

            // 2. Generate New Password Hash & Salt
            SecurityHelper.CreatePasswordHash(request.NewPassword, out byte[] newHash, out byte[] newSalt);

            // 3. Update User
            user.PasswordHash = newHash;
            user.PasswordSalt = newSalt;
            user.PasswordResetCode = null; // Clear the code so it can't be reused!

            _uow.UserRepository.Update(user);
            await _uow.SaveChangesAsync();

            return ServiceResult.Success("Password has been reset successfully. You can now login.", "PASSWORD_RESET_SUCCESSFUL");
        }
    }
}
