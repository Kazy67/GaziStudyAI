using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GaziStudyAI.WebAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BaseController : ControllerBase
    {
        protected Guid GetUserId()
        {
            var userIdClaim = User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
            {
                throw new UnauthorizedAccessException("User ID not found in token.");
            }
            return userId;
        }

        // Helper to get Role
        protected string GetUserRole()
        {
            var roleClaim = User?.FindFirst("Role")?.Value;
            if (string.IsNullOrEmpty(roleClaim))
            {
                throw new UnauthorizedAccessException("Role not found in token.");
            }
            return roleClaim;
        }
    }
}
