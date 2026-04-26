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

        [HttpGet("students")]
        public async Task<IActionResult> GetAllStudents()
        {
            var result = await _adminService.GetAllStudentsAsync();
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("system-logs")]
        public async Task<IActionResult> GetSystemLogs()
        {
            var result = await _adminService.GetSystemLogsAsync();
            return Ok(result);
        }
    }
}
