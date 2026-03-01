using GaziStudyAI.Application.DTOs.User;
using GaziStudyAI.Common.Result.Abstract;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface IUserService
    {
        Task<IResult> UpdateProfileAsync(Guid userId, UpdateProfileDto request);
        Task<IResult<UserProfileDto>> GetProfileAsync(Guid userId);
    }
}
