using AutoMapper;
using FluentValidation;
using GaziStudyAI.Application.DTOs.Course;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Result.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using GaziStudyAI.Domain.Entities.Courses;
using GaziStudyAI.Infrastructure.UnitOfWork.Abstract;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class CourseService : ICourseService
    {
        private readonly IUnitOfWork _uow;
        private readonly IMapper _mapper;
        private readonly IValidator<CreateCourseDto> _validator;
        private readonly IFileService _fileService;

        public CourseService(IUnitOfWork uow, IMapper mapper, IValidator<CreateCourseDto> validator, IFileService fileService)
        {
            _uow = uow;
            _mapper = mapper;
            _validator = validator;
            _fileService = fileService;
        }
        public async Task<IResult<Guid>> CreateCourseAsync(CreateCourseDto request)
        {
            var validationResult = await _validator.ValidateAsync(request);
            if (!validationResult.IsValid)
            {
                var errors = validationResult.Errors.Select(e => e.ErrorMessage).ToList();
                return ServiceResult<Guid>.Failure("Validation failed", "VALIDATION_ERROR", errors);
            }

            var course = _mapper.Map<Course>(request);

            if (!string.IsNullOrWhiteSpace(request.WeeksJson))
            {
                try
                {
                    // Clean the string of any weird accidental spaces or line breaks from Swagger
                    var cleanJson = request.WeeksJson.Trim();

                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var parsedWeeksDto = JsonSerializer.Deserialize<List<CreateCourseWeekDto>>(cleanJson, options);

                    if (parsedWeeksDto != null)
                    {
                        course.Weeks = _mapper.Map<List<CourseWeek>>(parsedWeeksDto);
                    }
                }
                catch (JsonException ex)
                {
                    var errors = new List<string>
                    {
                        "Invalid JSON format for WeeksJson.",
                        ex.Message,
                        $"What C# actually received: {request.WeeksJson}"
                    };
                    return ServiceResult<Guid>.Failure("JSON Parsing Failed", "JSON_ERROR", errors);
                }
            }

            if (request.Image != null && request.Image.Length > 0)
            {
                var imageUrl = await _fileService.UploadCourseImageAsync(request.Image);
                course.ImageUrl = imageUrl;
            }

            await _uow.CourseRepository.AddAsync(course);
            await _uow.SaveChangesAsync();

            return ServiceResult<Guid>.Success(course.Id, "Course created successfully.", "COURSE_CREATED");
        }

        public async Task<IResult<bool>> DeleteCourse(Guid courseId)
        {
            var course = await _uow.CourseRepository.GetByIdAsync(courseId);
            if (course == null || !course.IsActive)
            {
                return ServiceResult<bool>.Failure("Course not found", "COURSE_NOT_FOUND");
            }
            course.IsActive = false;
            _uow.CourseRepository.Update(course);
            await _uow.SaveChangesAsync();
            return ServiceResult<bool>.Success(true, "Course deleted successfully.", "COURSE_DELETED");
        }

        public async Task<IResult<IEnumerable<CourseDto>>> GetAllCoursesAsync()
        {
            var courses = await _uow.CourseRepository.GetQueryable()
                .Include(c => c.StudentCourses)
                .Where(c => c.IsActive)
                .ToListAsync();

            var dtos = _mapper.Map<IEnumerable<CourseDto>>(courses);

            return ServiceResult<IEnumerable<CourseDto>>.Success(dtos);
        }

        public async Task<IResult<CourseDto>> GetCourseByIdAsync(Guid courseId)
        {
            var course = await _uow.CourseRepository.GetQueryable()
                .Include(c => c.Weeks)
                .Include(c => c.StudentCourses)
                .Where(c => c.IsActive)
                .FirstOrDefaultAsync(c => c.Id == courseId);
            if (course == null)
            {
                return ServiceResult<CourseDto>.Failure("Course not found", "COURSE_NOT_FOUND");
            }
            var dto = _mapper.Map<CourseDto>(course);

            if (dto.Weeks != null && dto.Weeks.Any())
            {
                dto.Weeks = dto.Weeks.OrderBy(w => w.WeekNumber).ToList();
            }
            return ServiceResult<CourseDto>.Success(dto);
        }

        public async Task<IResult<Guid>> UpdateCourseAsync(UpdateCourseDto request)
        {
            // 1. Fetch the course
            var course = await _uow.CourseRepository.GetQueryable()
                .AsTracking()
                .Include(c => c.Weeks)
                .FirstOrDefaultAsync(c => c.Id == request.Id && c.IsActive);

            if (course == null)
            {
                return ServiceResult<Guid>.Failure("Course not found", "COURSE_NOT_FOUND");
            }

            // 2. EXPLICITLY MAP PROPERTIES (Do not use AutoMapper for the root object here)
            // This guarantees EF Core's Change Tracker sees exactly what changed.
            course.Prefix = request.Prefix;
            course.NameTr = request.NameTr;
            course.NameEn = request.NameEn;
            course.DescriptionTr = request.DescriptionTr;
            course.DescriptionEn = request.DescriptionEn;
            course.TeacherName = request.TeacherName;
            course.Credits = request.Credits;
            course.YearLevel = request.YearLevel;
            course.AllowTheoryQuestions = request.AllowTheoryQuestions;
            course.AllowCodeQuestions = request.AllowCodeQuestions;
            course.AllowMathQuestions = request.AllowMathQuestions;

            // 3. Handle Child Collections (Weeks)
            if (!string.IsNullOrWhiteSpace(request.WeeksJson))
            {
                try
                {
                    var cleanJson = request.WeeksJson.Trim();
                    var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                    var parsedWeeksDto = JsonSerializer.Deserialize<List<CreateCourseWeekDto>>(cleanJson, options);

                    if (parsedWeeksDto != null)
                    {
                        // THE FIX: Sync the lists instead of clearing them!
                        var existingWeeks = course.Weeks.OrderBy(w => w.WeekNumber).ToList();
                        var incomingWeeks = parsedWeeksDto.OrderBy(w => w.WeekNumber).ToList();

                        for (int i = 0; i < incomingWeeks.Count; i++)
                        {
                            var incoming = incomingWeeks[i];

                            if (i < existingWeeks.Count)
                            {
                                // Update existing row (EF Core handles this perfectly)
                                existingWeeks[i].WeekNumber = incoming.WeekNumber;
                                existingWeeks[i].TopicTr = incoming.TopicTr;
                                existingWeeks[i].TopicEn = incoming.TopicEn;
                            }
                            else
                            {
                                // Add new row if they added extra weeks
                                course.Weeks.Add(new CourseWeek
                                {
                                    WeekNumber = incoming.WeekNumber,
                                    TopicTr = incoming.TopicTr,
                                    TopicEn = incoming.TopicEn
                                });
                            }
                        }

                        // If they removed weeks (e.g., changed from 14 to 12 weeks), 
                        // we blank out the remaining ones to effectively hide them
                        if (existingWeeks.Count > incomingWeeks.Count)
                        {
                            for (int i = incomingWeeks.Count; i < existingWeeks.Count; i++)
                            {
                                existingWeeks[i].TopicTr = "";
                                existingWeeks[i].TopicEn = "";
                            }
                        }
                    }
                }
                catch (JsonException ex)
                {
                    return ServiceResult<Guid>.Failure("JSON Parsing Failed", "JSON_ERROR", new List<string> { ex.Message });
                }
            }
            // 4. Handle Image
            if (request.Image != null && request.Image.Length > 0)
            {
                var newImageUrl = await _fileService.UploadCourseImageAsync(request.Image);
                course.ImageUrl = newImageUrl;
            }

            // 5. Save changes! 
            // Do NOT call _uow.CourseRepository.Update(course);
            await _uow.SaveChangesAsync();

            return ServiceResult<Guid>.Success(course.Id, "Course updated successfully.", "COURSE_UPDATED");
        }


        // Inside CourseService.cs
        public async Task<IResult<bool>> UploadCourseMaterialAsync(Guid courseId, int weekNumber, IFormFile file)
        {
            // 1. Get the course to find its Prefix
            var course = await _uow.CourseRepository.GetByIdAsync(courseId);
            if (course == null) return ServiceResult<bool>.Failure("Course not found", "NOT_FOUND");

            // Form the week tag, e.g., "mth_hafta_1"
            string weekTag = $"{course.Prefix.ToLower()}_hafta_{weekNumber}";

            try
            {
                // 2. Prepare the multipart form data for Python
                using var client = new HttpClient();
                client.BaseAddress = new Uri("http://localhost:8000"); // Your Python API URL

                using var content = new MultipartFormDataContent();

                // Add the file
                var fileStreamContent = new StreamContent(file.OpenReadStream());
                fileStreamContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
                content.Add(fileStreamContent, "file", file.FileName);

                // Add the week_tag
                content.Add(new StringContent(weekTag), "week_tag");

                // 3. Send to Python
                var response = await client.PostAsync("/ai/ingest-material", content);
                var responseString = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode && responseString.Contains("\"success\":true", StringComparison.OrdinalIgnoreCase))
                {
                    return ServiceResult<bool>.Success(true, "Material uploaded and vectorized successfully!");
                }
                else
                {
                    return ServiceResult<bool>.Failure($"Python AI Error: {responseString}", "AI_ERROR");
                }
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Connection to AI failed: {ex.Message}", "CONNECTION_ERROR");
            }
        }

        public async Task<IResult<Dictionary<string, string>>> GetCourseMaterialsStatusAsync(Guid courseId)
        {
            var course = await _uow.CourseRepository.GetByIdAsync(courseId);
            if (course == null) return ServiceResult<Dictionary<string, string>>.Failure("Course not found", "NOT_FOUND");

            try
            {
                using var client = new HttpClient();
                client.BaseAddress = new Uri("http://localhost:8000"); // Python URL

                var response = await client.GetAsync($"/ai/course-materials/{course.Prefix.ToLower()}");
                var responseString = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    using var doc = JsonDocument.Parse(responseString);
                    var success = doc.RootElement.GetProperty("success").GetBoolean();

                    if (success)
                    {
                        var dataElement = doc.RootElement.GetProperty("data");
                        var resultDict = JsonSerializer.Deserialize<Dictionary<string, string>>(dataElement.GetRawText());
                        return ServiceResult<Dictionary<string, string>>.Success(resultDict ?? new Dictionary<string, string>());
                    }
                }
                return ServiceResult<Dictionary<string, string>>.Failure("Failed to get materials from AI", "AI_ERROR");
            }
            catch (Exception ex)
            {
                return ServiceResult<Dictionary<string, string>>.Failure($"Connection to AI failed: {ex.Message}", "CONNECTION_ERROR");
            }
        }

        public async Task<IResult<bool>> DeleteCourseMaterialAsync(string weekTag)
        {
            try
            {
                using var client = new HttpClient();
                client.BaseAddress = new Uri("http://localhost:8000"); // Python URL

                var response = await client.DeleteAsync($"/ai/delete-material/{weekTag}");

                if (response.IsSuccessStatusCode)
                {
                    return ServiceResult<bool>.Success(true, "Material deleted successfully.");
                }
                return ServiceResult<bool>.Failure("Failed to delete material from AI", "AI_ERROR");
            }
            catch (Exception ex)
            {
                return ServiceResult<bool>.Failure($"Connection to AI failed: {ex.Message}", "CONNECTION_ERROR");
            }
        }

        public async Task<IResult<StudentExamSetupDto>> GetStudentExamSetupAsync(Guid courseId)
        {
            // 1. Get Course Details
            var courseResult = await GetCourseByIdAsync(courseId);
            if (!courseResult.IsSuccess || courseResult.Data == null)
            {
                return ServiceResult<StudentExamSetupDto>.Failure("Course not found", "COURSE_NOT_FOUND");
            }

            // 2. Get Uploaded Materials from Python
            var materialsResult = await GetCourseMaterialsStatusAsync(courseId);
            var uploadedWeeks = new List<int>();

            if (materialsResult.IsSuccess && materialsResult.Data != null)
            {
                // materialsResult.Data looks like: {"os_hafta_1": "file.pdf"}
                foreach (var key in materialsResult.Data.Keys)
                {
                    var parts = key.Split('_');
                    if (parts.Length > 0 && int.TryParse(parts.Last(), out int weekNum))
                    {
                        uploadedWeeks.Add(weekNum);
                    }
                }
            }

            // 3. Combine into our clean DTO
            var responseDto = new StudentExamSetupDto
            {
                Course = courseResult.Data,
                ValidWeeks = uploadedWeeks.OrderBy(w => w).ToList() // Sorted for convenience
            };

            return ServiceResult<StudentExamSetupDto>.Success(responseDto);
        }
    }
}
