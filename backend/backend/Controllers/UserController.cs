using GaziStudyAI.Application.DTOs.User;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GaziStudyAI.WebAPI.Controllers
{
    [Authorize]
    public class UserController : BaseController
    {
        private readonly IUserService _userService;

        public UserController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPut("profile")]
        public async Task<IActionResult> UpdateProfile([FromForm] UpdateProfileDto request)
        {
            try
            {
                // 1. Get the securely logged-in User's ID using BaseController!
                Guid userId = GetUserId();

                // 2. Pass it to the service
                var result = await _userService.UpdateProfileAsync(userId, request);

                if (!result.IsSuccess) return BadRequest(result);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                // Catch the exception thrown by BaseController and return a clean 401 response
                return Unauthorized(ServiceResult.Failure(ex.Message, "UNAUTHORIZED"));
            }
        }

        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            try
            {
                Guid userId = GetUserId();

                var result = await _userService.GetProfileAsync(userId);

                if (!result.IsSuccess) return BadRequest(result);

                return Ok(result);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Unauthorized(ServiceResult.Failure(ex.Message, "UNAUTHORIZED"));
            }
        }
    }
}
