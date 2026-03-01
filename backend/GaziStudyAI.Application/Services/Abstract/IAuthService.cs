using GaziStudyAI.Application.DTOs.Auth;
using GaziStudyAI.Common.Result.Abstract;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface IAuthService
    {
        Task<IResult<AuthResponseDto>> RegisterAsync(RegisterDto request);
        Task<IResult<AuthResponseDto>> LoginAsync(LoginDto request);
        Task<IResult> VerifyEmailAsync(VerifyEmailDto request);
        Task<IResult> ResendVerificationCodeAsync(ResendVerificationDto request);
        Task<IResult> ForgotPasswordAsync(ForgotPasswordDto request);
        Task<IResult> ResetPasswordAsync(ResetPasswordDto request);
    }
}
