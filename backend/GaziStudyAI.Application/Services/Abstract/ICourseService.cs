using GaziStudyAI.Application.DTOs.Course;
using GaziStudyAI.Common.Result.Abstract;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface ICourseService
    {
        Task<IResult<IEnumerable<CourseDto>>> GetAllCoursesAsync();
        Task<IResult<Guid>> CreateCourseAsync(CreateCourseDto request);
        Task<IResult<CourseDto>> GetCourseByIdAsync(Guid courseId);
    }
}
