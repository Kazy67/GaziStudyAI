using GaziStudyAI.Application.DTOs.Exam;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Result.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using System.Text;
using System.Text.Json;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class AIExamService : IAIExamService
    {
        private readonly HttpClient _httpClient;

        public AIExamService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://127.0.0.1:8000/"); // Python API URL
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
    }
}
