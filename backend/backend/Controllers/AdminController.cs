using GaziStudyAI.Application.Services.Abstract;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GaziStudyAI.WebAPI.Controllers
{
    [Authorize(Roles = "Admin")]
    public class AdminController : BaseController
    {
        private readonly IAdminService _adminService;
        public AdminController(IAdminService adminService)
        {
            _adminService = adminService;
        }

        [HttpGet("statistics")]
        public async Task<IActionResult> GetPlatformStats()
        {
            var result = await _adminService.GetPlatformStatisticsAsync();
            return Ok(result);
        }
    }
}
