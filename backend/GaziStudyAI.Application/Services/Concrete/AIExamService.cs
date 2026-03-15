using AutoMapper;
using GaziStudyAI.Application.DTOs.Exam;
using GaziStudyAI.Application.DTOs.Student;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Result.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using GaziStudyAI.Domain.Entities.Exams;
using GaziStudyAI.Domain.Enums;
using GaziStudyAI.Infrastructure.UnitOfWork.Abstract;
using Microsoft.EntityFrameworkCore;
using System.Text;
using System.Text.Json;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class AIExamService : IAIExamService
    {
        private readonly HttpClient _httpClient;
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;

        public AIExamService(HttpClient httpClient, IUnitOfWork uow, IMapper mapper)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://127.0.0.1:8000/"); // Python API URL
            _uow = uow;
            _mapper = mapper;
        }
        public async Task<IResult<List<GeneratedClassicQuestionDto>>> GenerateClassicExamAsync(GenerateClassicRequestDto request)
        {
            try
            {
                // 👇 1. Create the anonymous object with EXACT snake_case names for Python
                var pythonPayload = new
                {
                    course_prefix = request.CoursePrefix,
                    weeks = request.Weeks,
                    question_count = request.QuestionCount,
                    difficulty = request.Difficulty
                };

                // 👇 2. Serialize this new pythonPayload instead of 'request'
                var content = new StringContent(JsonSerializer.Serialize(pythonPayload), Encoding.UTF8, "application/json");

                // Make sure this matches your Python router path
                var response = await _httpClient.PostAsync("ai/generate-classic", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return ServiceResult<List<GeneratedClassicQuestionDto>>.Failure($"API Error: {errorContent}", "AI_API_ERROR");
                }

                var responseString = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var pythonResult = JsonSerializer.Deserialize<PythonClassicResponse>(responseString, options);

                if (pythonResult == null || !pythonResult.Success || pythonResult.Data == null)
                    return ServiceResult<List<GeneratedClassicQuestionDto>>.Failure(pythonResult?.Error ?? "Python fail", "AI_FAIL");

                return ServiceResult<List<GeneratedClassicQuestionDto>>.Success(pythonResult.Data);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<GeneratedClassicQuestionDto>>.Failure(ex.Message, "AI_CONNECTION_ERROR");
            }
        }

        public async Task<IResult<StudentDashboardDto>> GetStudentDashboardAsync(Guid userId)
        {
            try
            {
                var userExams = await _uow.ExamRepository.GetQueryable()
                    .Include(e => e.Course)
                    .Where(e => e.UserId == userId && e.IsCompleted)
                    .OrderByDescending(e => e.CreatedDate)
                    .ToListAsync();

                var dashboard = new StudentDashboardDto
                {
                    TotalExamsTaken = userExams.Count,
                    AverageScore = userExams.Any() ? userExams.Average(e => e.Score ?? 0) : 0,
                    RecentExams = _mapper.Map<List<ExamHistoryDto>>(userExams.Take(10))
                };

                return ServiceResult<StudentDashboardDto>.Success(dashboard);
            }
            catch (Exception ex)
            {
                return ServiceResult<StudentDashboardDto>.Failure($"Failed to load dashboard: {ex.Message}");
            }
        }

        public async Task<IResult<Guid>> SaveExamResultAsync(Guid userId, SubmitExamDto request)
        {
            try
            {
                // 1. Map the entire request instantly using AutoMapper
                var exam = _mapper.Map<Exam>(request);

                // 2. Add the backend-only fields
                exam.UserId = userId;
                exam.IsCompleted = true;
                exam.Difficulty = Enum.Parse<DifficultyLevel>(request.Difficulty, true);
                exam.CreatedDate = DateTime.UtcNow;
                exam.CreatedBy = userId;

                foreach (var q in exam.Questions)
                {
                    q.CreatedDate = DateTime.UtcNow;
                    q.CreatedBy = userId;
                }

                // 3. Save using UnitOfWork
                await _uow.ExamRepository.AddAsync(exam);
                await _uow.SaveChangesAsync();

                return ServiceResult<Guid>.Success(exam.Id, "Exam saved successfully.");
            }
            catch (Exception ex)
            {
                return ServiceResult<Guid>.Failure($"Database Error: {ex.Message}");
            }
        }

        public async Task<IResult<EvaluationResultDto>> EvaluateClassicQuestionAsync(EvaluateClassicQuestionDto request)
        {
            try
            {
                var pythonPayload = new
                {
                    visualType = request.VisualType,
                    questionText = request.QuestionText,
                    solutionData = request.SolutionData,
                    studentData = request.StudentData
                };

                var content = new StringContent(JsonSerializer.Serialize(pythonPayload), Encoding.UTF8, "application/json");

                // Call the python endpoint
                var response = await _httpClient.PostAsync("ai/evaluate-classic", content);

                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return ServiceResult<EvaluationResultDto>.Failure($"API Error: {errorContent}", "AI_API_ERROR");
                }

                var responseString = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var pythonResult = JsonSerializer.Deserialize<PythonEvaluationResponse>(responseString, options);

                if (pythonResult == null || !pythonResult.Success || pythonResult.Data == null)
                    return ServiceResult<EvaluationResultDto>.Failure(pythonResult?.Error ?? "Python fail", "AI_FAIL");

                return ServiceResult<EvaluationResultDto>.Success(pythonResult.Data);
            }
            catch (Exception ex)
            {
                return ServiceResult<EvaluationResultDto>.Failure(ex.Message, "AI_CONNECTION_ERROR");
            }
        }
    }
}
