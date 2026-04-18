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
        private readonly ICourseService _courseService;

        public AIExamService(HttpClient httpClient, IUnitOfWork uow, IMapper mapper, ICourseService courseService)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://127.0.0.1:8000/"); // Python API URL
            _httpClient.Timeout = TimeSpan.FromMinutes(4);
            _uow = uow;
            _mapper = mapper;
            _courseService = courseService;
        }
        public async Task<IResult<List<GeneratedClassicQuestionDto>>> GenerateClassicExamAsync(GenerateClassicRequestDto request)
        {
            try
            {
                var course = await _uow.CourseRepository.GetAsync(c => c.Prefix.ToLower() == request.CoursePrefix.ToLower());

                bool allowTheory = course?.AllowTheoryQuestions ?? true;
                bool allowCode = course?.AllowCodeQuestions ?? false;
                bool allowMath = course?.AllowMathQuestions ?? false;

                // 👇 1. Create the anonymous object with EXACT snake_case names for Python
                var pythonPayload = new
                {
                    course_prefix = request.CoursePrefix,
                    weeks = request.Weeks,
                    question_count = request.QuestionCount,
                    difficulty = request.Difficulty,
                    allow_theory = allowTheory,
                    allow_code = allowCode,
                    allow_math = allowMath
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

                    if (q.Type.ToString() == "MultipleChoice" && !string.IsNullOrEmpty(q.InputDataJson))
                    {
                        try
                        {
                            using var inputDoc = JsonDocument.Parse(q.InputDataJson);
                            if (inputDoc.RootElement.TryGetProperty("options", out var optElement) && optElement.ValueKind == JsonValueKind.Array)
                            {
                                var optList = optElement.EnumerateArray().Select(o => o.GetString()).ToList();
                                if (optList.Count > 0) q.OptionA = optList[0];
                                if (optList.Count > 1) q.OptionB = optList[1];
                                if (optList.Count > 2) q.OptionC = optList[2];
                                if (optList.Count > 3) q.OptionD = optList[3];
                            }

                            if (!string.IsNullOrEmpty(q.SolutionJson))
                            {
                                using var solDoc = JsonDocument.Parse(q.SolutionJson);
                                if (solDoc.RootElement.TryGetProperty("answer", out var ansElement))
                                {
                                    q.CorrectAnswer = ansElement.GetString() ?? "";
                                }
                            }
                        }
                        catch { /* Ignore parsing errors, it will just leave them null */ }
                    }

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

        public async Task<IResult<List<ExamHistoryItemDto>>> GetStudentExamHistoryAsync(Guid userId)
        {
            try
            {
                var exams = await _uow.ExamRepository.GetQueryable()
                    .Include(e => e.Course)
                    .Include(e => e.Questions) // Include questions to count them
                    .Where(e => e.UserId == userId && e.IsCompleted)
                    .OrderByDescending(e => e.CreatedDate)
                    .ToListAsync();

                var dtos = exams.Select(e => new ExamHistoryItemDto
                {
                    Id = e.Id,
                    CourseName = e.Course != null ? (e.Course.Prefix + " - " + e.Course.NameTr) : "Bilinmeyen Ders",
                    CoursePrefix = e.Course?.Prefix ?? "",
                    CreatedDate = e.CreatedDate,
                    Score = (decimal)(e.Score ?? 0),
                    Difficulty = e.Difficulty.ToString(),
                    TotalQuestions = e.Questions.Count,
                    ExamType = e.Questions.FirstOrDefault()?.Type.ToString() ?? "MultipleChoice"
                }).ToList();

                return ServiceResult<List<ExamHistoryItemDto>>.Success(dtos);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<ExamHistoryItemDto>>.Failure($"History Error: {ex.Message}");
            }
        }

        public async Task<IResult<ExamReviewDetailDto>> GetExamReviewDetailsAsync(Guid examId, Guid userId)
        {
            try
            {
                var exam = await _uow.ExamRepository.GetQueryable()
                    .Include(e => e.Course)
                    .Include(e => e.Questions)
                    .FirstOrDefaultAsync(e => e.Id == examId && e.UserId == userId);

                if (exam == null)
                    return ServiceResult<ExamReviewDetailDto>.Failure("Sınav bulunamadı veya yetkiniz yok.", "NOT_FOUND");

                var reviewDto = new ExamReviewDetailDto
                {
                    Id = exam.Id,
                    CourseName = exam.Course != null ? (exam.Course.Prefix + " - " + exam.Course.NameTr) : "Bilinmeyen Ders",
                    CreatedDate = exam.CreatedDate,
                    Score = (decimal)(exam.Score ?? 0),
                    Difficulty = exam.Difficulty.ToString(),

                    // 👇 NEW: Expand the Select to handle older null records
                    Questions = exam.Questions.Select(q =>
                    {
                        var dto = new QuestionReviewDto
                        {
                            Id = q.Id,
                            Text = q.Text,
                            Type = q.Type.ToString(),
                            OptionA = q.OptionA,
                            OptionB = q.OptionB,
                            OptionC = q.OptionC,
                            OptionD = q.OptionD,
                            CorrectAnswer = q.CorrectAnswer,
                            StudentAnswer = q.StudentAnswer,
                            IsCorrect = q.IsCorrect,
                            InputDataJson = q.InputDataJson,
                            SolutionJson = q.SolutionJson
                        };

                        // Fallback for older exams where DB columns are null but JSON has data
                        if (dto.Type == "MultipleChoice" && dto.OptionA == null && !string.IsNullOrEmpty(dto.InputDataJson))
                        {
                            try
                            {
                                using var inputDoc = JsonDocument.Parse(dto.InputDataJson);
                                if (inputDoc.RootElement.TryGetProperty("options", out var optElement))
                                {
                                    var optList = optElement.EnumerateArray().Select(o => o.GetString()).ToList();
                                    if (optList.Count > 0) dto.OptionA = optList[0];
                                    if (optList.Count > 1) dto.OptionB = optList[1];
                                    if (optList.Count > 2) dto.OptionC = optList[2];
                                    if (optList.Count > 3) dto.OptionD = optList[3];
                                }

                                if (!string.IsNullOrEmpty(dto.SolutionJson))
                                {
                                    using var solDoc = JsonDocument.Parse(dto.SolutionJson);
                                    if (solDoc.RootElement.TryGetProperty("answer", out var ansElement))
                                    {
                                        dto.CorrectAnswer = ansElement.GetString() ?? "";
                                    }
                                }
                            }
                            catch { }
                        }
                        return dto;
                    }).ToList()
                };

                return ServiceResult<ExamReviewDetailDto>.Success(reviewDto);
            }
            catch (Exception ex)
            {
                return ServiceResult<ExamReviewDetailDto>.Failure($"Review Error: {ex.Message}");
            }
        }

        public async Task<IResult<StudentAnalyticsDto>> GetStudentAnalyticsAsync(Guid userId)
        {
            try
            {
                // 1. Fetch all completed exams for this user
                var exams = await _uow.ExamRepository.GetQueryable()
                    .Include(e => e.Course)
                    .Where(e => e.UserId == userId && e.IsCompleted)
                    .OrderBy(e => e.CreatedDate) // Order chronologically for the timeline
                    .ToListAsync();

                if (!exams.Any())
                {
                    return ServiceResult<StudentAnalyticsDto>.Success(new StudentAnalyticsDto());
                }

                // 2. Calculate aggregations
                var analytics = new StudentAnalyticsDto
                {
                    TotalExamsTaken = exams.Count,
                    OverallAverageScore = Math.Round(exams.Average(e => (decimal)(e.Score ?? 0)), 1),

                    // Group by Course to get performance per subject
                    CoursePerformances = exams
                        .Where(e => e.Course != null)
                        .GroupBy(e => e.Course.Prefix + " - " + e.Course.NameTr)
                        .Select(g => new CoursePerformanceDto
                        {
                            CourseName = g.Key,
                            ExamsTaken = g.Count(),
                            AverageScore = Math.Round(g.Average(e => (decimal)(e.Score ?? 0)), 1)
                        })
                        .OrderByDescending(c => c.ExamsTaken) // Sort by most practiced courses
                        .ToList(),

                    // Get the last 15 exams for a timeline chart
                    ScoreTimeline = exams
                        .TakeLast(15) // Keep the chart from getting too crowded
                        .Select(e => new ScoreTimelineDto
                        {
                            ExamDate = e.CreatedDate,
                            Score = (decimal)(e.Score ?? 0),
                            CoursePrefix = e.Course?.Prefix ?? "Genel"
                        })
                        .ToList()
                };

                return ServiceResult<StudentAnalyticsDto>.Success(analytics);
            }
            catch (Exception ex)
            {
                return ServiceResult<StudentAnalyticsDto>.Failure($"Analytics Error: {ex.Message}");
            }
        }

        public async Task<IResult<string>> SendChatMessageAsync(SendChatMessageDto request)
        {
            try
            {
                // 1. Get Course Prefix
                var course = await _uow.CourseRepository.GetByIdAsync(request.CourseId);
                if (course == null) return ServiceResult<string>.Failure("Course not found.");

                // 2. Use the injected CourseService to find uploaded weeks!
                var materialsResult = await _courseService.GetCourseMaterialsStatusAsync(request.CourseId);
                var uploadedWeeks = new List<int>();

                if (materialsResult.IsSuccess && materialsResult.Data != null)
                {
                    foreach (var key in materialsResult.Data.Keys)
                    {
                        var parts = key.Split('_');
                        if (parts.Length > 0 && int.TryParse(parts.Last(), out int weekNum))
                        {
                            uploadedWeeks.Add(weekNum);
                        }
                    }
                }

                // 3. Send to Python
                var pythonPayload = new
                {
                    course_prefix = course.Prefix,
                    weeks = uploadedWeeks,
                    message = request.Message
                };

                var content = new StringContent(JsonSerializer.Serialize(pythonPayload), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("ai/chat", content);

                if (!response.IsSuccessStatusCode) return ServiceResult<string>.Failure("AI API Error");

                var responseString = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseString);

                if (doc.RootElement.GetProperty("success").GetBoolean())
                {
                    var reply = doc.RootElement.GetProperty("data").GetProperty("reply").GetString();
                    return ServiceResult<string>.Success(reply ?? "");
                }

                return ServiceResult<string>.Failure("AI Failed to process.");
            }
            catch (Exception ex)
            {
                return ServiceResult<string>.Failure(ex.Message);
            }
        }

    }
}
