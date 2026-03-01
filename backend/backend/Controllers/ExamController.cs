using GaziStudyAI.Application.DTOs.Exam;
using GaziStudyAI.Application.DTOs.Test;
using GaziStudyAI.Application.Services.Abstract;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace GaziStudyAI.WebAPI.Controllers
{
    [Authorize]
    public class ExamController : BaseController
    {
        private readonly IAITestService _aiTestService;
        private readonly IAIExamService _aiExamService;

        public ExamController(IAITestService aiTestService, IAIExamService aiExamService)
        {
            _aiTestService = aiTestService;
            _aiExamService = aiExamService;
        }

        [HttpPost("generate-test")]
        public async Task<IActionResult> GenerateExam([FromBody] GenerateTestRequestDto request)
        {
            var result = await _aiTestService.GenerateMultipleChoiceExamAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("generate-classic")]
        public async Task<IActionResult> GenerateClassicExam([FromBody] GenerateClassicRequestDto request)
        {
            var result = await _aiExamService.GenerateClassicExamAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
    }
}
