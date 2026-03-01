using GaziStudyAI.Application.DTOs.Test;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Result.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using System.Text;
using System.Text.Json;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class AITestService : IAITestService
    {
        private readonly HttpClient _httpClient;

        public AITestService(HttpClient httpClient)
        {
            _httpClient = httpClient;
            _httpClient.BaseAddress = new Uri("http://127.0.0.1:8000/"); // Python API URL
        }

        public async Task<IResult<List<GeneratedQuestionDto>>> GenerateMultipleChoiceExamAsync(GenerateTestRequestDto request)
        {
            try
            {
                // 👇 1. Create an anonymous object with EXACT snake_case names for Python
                var pythonPayload = new
                {
                    course_prefix = request.CoursePrefix,
                    weeks = request.Weeks,
                    question_count = request.QuestionCount,
                    difficulty = request.Difficulty
                };

                // 👇 2. Serialize this new object instead of the 'request'
                var content = new StringContent(JsonSerializer.Serialize(pythonPayload), Encoding.UTF8, "application/json");

                // Call Python
                var response = await _httpClient.PostAsync("ai/generate-test", content);

                // If it fails, read the error message so we can see exactly what FastAPI complained about
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    return ServiceResult<List<GeneratedQuestionDto>>.Failure($"Python API Error: {errorContent}", "AI_API_ERROR");
                }

                var responseString = await response.Content.ReadAsStringAsync();
                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var pythonResult = JsonSerializer.Deserialize<PythonTestResponse>(responseString, options);

                if (pythonResult == null || !pythonResult.Success || pythonResult.Data == null)
                    return ServiceResult<List<GeneratedQuestionDto>>.Failure(pythonResult?.Error ?? "Python fail", "AI_FAIL");

                return ServiceResult<List<GeneratedQuestionDto>>.Success(pythonResult.Data);
            }
            catch (Exception ex)
            {
                return ServiceResult<List<GeneratedQuestionDto>>.Failure(ex.Message, "AI_CONNECTION_ERROR");
            }
        }
    }
}
