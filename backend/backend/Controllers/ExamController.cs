using GaziStudyAI.Application.DTOs.Exam;
using GaziStudyAI.Application.DTOs.Student;
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

        [HttpPost("evaluate-classic")]
        public async Task<IActionResult> EvaluateClassicQuestion([FromBody] EvaluateClassicQuestionDto request)
        {
            var result = await _aiExamService.EvaluateClassicQuestionAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("submit-result")]
        public async Task<IActionResult> SubmitExamResult([FromBody] SubmitExamDto request)
        {
            Guid userId = GetUserId(); // Securely get the user from the token
            var result = await _aiExamService.SaveExamResultAsync(userId, request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("dashboard")]
        public async Task<IActionResult> GetDashboard()
        {
            Guid userId = GetUserId();
            var result = await _aiExamService.GetStudentDashboardAsync(userId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("history")]
        public async Task<IActionResult> GetMyHistory()
        {
            Guid userId = GetUserId(); // Securely get user from JWT Token
            var result = await _aiExamService.GetStudentExamHistoryAsync(userId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpGet("history/{examId}")]
        public async Task<IActionResult> GetExamReview(Guid examId)
        {
            Guid userId = GetUserId(); // Securely get user from JWT Token
            var result = await _aiExamService.GetExamReviewDetailsAsync(examId, userId);
            if (!result.IsSuccess) return NotFound(result);
            return Ok(result);
        }

        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            Guid userId = GetUserId(); // Securely get user from JWT Token
            var result = await _aiExamService.GetStudentAnalyticsAsync(userId);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("study-room/chat")]
        public async Task<IActionResult> SendChatMessage([FromBody] SendChatMessageDto request)
        {
            var result = await _aiExamService.SendChatMessageAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }

        [HttpPost("generate-mock")]
        public async Task<IActionResult> GenerateMockExam([FromBody] GenerateMockExamRequestDto request)
        {
            var result = await _aiExamService.GenerateMockExamAsync(request);
            if (!result.IsSuccess) return BadRequest(result);
            return Ok(result);
        }
    }
}
