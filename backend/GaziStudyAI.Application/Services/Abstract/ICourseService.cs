using GaziStudyAI.Application.DTOs.Course;
using GaziStudyAI.Common.Result.Abstract;
using Microsoft.AspNetCore.Http;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface ICourseService
    {
        Task<IResult<IEnumerable<CourseDto>>> GetAllCoursesAsync();
        Task<IResult<Guid>> CreateCourseAsync(CreateCourseDto request);
        Task<IResult<CourseDto>> GetCourseByIdAsync(Guid courseId);
        Task<IResult<bool>> DeleteCourse(Guid courseId);
        Task<IResult<Guid>> UpdateCourseAsync(UpdateCourseDto request);
        Task<IResult<bool>> UploadCourseMaterialAsync(Guid courseId, int weekNumber, IFormFile file);
        Task<IResult<Dictionary<string, string>>> GetCourseMaterialsStatusAsync(Guid courseId);
        Task<IResult<bool>> DeleteCourseMaterialAsync(string weekTag);
        Task<IResult<StudentExamSetupDto>> GetStudentExamSetupAsync(Guid courseId);
    }
}
