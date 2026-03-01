using AutoMapper;
using FluentValidation;
using GaziStudyAI.Application.DTOs.Course;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Result.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using GaziStudyAI.Domain.Entities.Courses;
using GaziStudyAI.Infrastructure.UnitOfWork.Abstract;
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

            return ServiceResult<Guid>.Success(course.Id, "Course created successfully.", "CourseCreated");
        }

        public async Task<IResult<IEnumerable<CourseDto>>> GetAllCoursesAsync()
        {
            var courses = await _uow.CourseRepository.GetAllAsync();
            var dtos = _mapper.Map<IEnumerable<CourseDto>>(courses);

            return ServiceResult<IEnumerable<CourseDto>>.Success(dtos);
        }

        public async Task<IResult<CourseDto>> GetCourseByIdAsync(Guid courseId)
        {
            var course = await _uow.CourseRepository.GetQueryable()
                .Include(c => c.Weeks)
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
    }
}
