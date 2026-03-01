using AutoMapper;
using GaziStudyAI.Application.DTOs.Course;
using GaziStudyAI.Domain.Entities.Courses;

namespace GaziStudyAI.Application.Mappings
{
    public class CourseProfile : Profile
    {
        public CourseProfile()
        {
            CreateMap<CreateCourseWeekDto, CourseWeek>();
            CreateMap<CourseWeek, CourseWeekDto>();
            CreateMap<CreateCourseDto, Course>()
                .ForMember(dest => dest.ImageUrl, opt => opt.Ignore()); // Ignore the file upload, handled separately

            // Map Entity to DTO (For sending to Angular)
            CreateMap<Course, CourseDto>();
        }
    }
}
