using GaziStudyAI.Application.DTOs.Course;
using GaziStudyAI.Application.Services.Abstract;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GaziStudyAI.WebAPI.Controllers
{
    [Authorize]
    public class CourseController : BaseController
    {
        private readonly ICourseService _courseService;

        public CourseController(ICourseService courseService)
        {
            _courseService = courseService;
        }

        [HttpGet]
        public async Task<IActionResult> GetAllCourses()
        {
            var result = await _courseService.GetAllCoursesAsync();
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost]
        // [Authorize(Roles = "Admin")] <-- Uncomment this later so ONLY admins can create courses!
        public async Task<IActionResult> CreateCourse([FromForm] CreateCourseDto request)
        {
            var result = await _courseService.CreateCourseAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetCourseById(Guid id)
        {
            var result = await _courseService.GetCourseByIdAsync(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCourse(Guid id)
        {
            var result = await _courseService.DeleteCourse(id);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpPut]
        // [Authorize(Roles = "Admin")] <-- Uncomment later
        public async Task<IActionResult> UpdateCourse([FromForm] UpdateCourseDto request)
        {
            var result = await _courseService.UpdateCourseAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("{courseId}/weeks/{weekNumber}/upload-material")]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UploadMaterial(Guid courseId, int weekNumber, IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("File is required.");

            var result = await _courseService.UploadCourseMaterialAsync(courseId, weekNumber, file);
            if (!result.IsSuccess) return BadRequest(result);

            return Ok(result);
        }

        [HttpGet("{courseId}/materials")]
        public async Task<IActionResult> GetMaterialsStatus(Guid courseId)
        {
            var result = await _courseService.GetCourseMaterialsStatusAsync(courseId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpDelete("materials/{weekTag}")]
        // [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteMaterial(string weekTag)
        {
            var result = await _courseService.DeleteCourseMaterialAsync(weekTag);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("{courseId}/student-exam-setup")]
        public async Task<IActionResult> GetStudentExamSetup(Guid courseId)
        {
            var result = await _courseService.GetStudentExamSetupAsync(courseId);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpGet("courses-average")]
        public async Task<IActionResult> GetCourseAverageScore()
        {
            Guid userId = GetUserId();
            var result = await _courseService.GetCourseAverageScore(userId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
    }
}
