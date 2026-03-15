using AutoMapper;
using GaziStudyAI.Application.DTOs.Exam;
using GaziStudyAI.Application.DTOs.Student;
using GaziStudyAI.Domain.Entities.Exams;

namespace GaziStudyAI.Application.Mappings
{
    public class ExamProfile : Profile
    {
        public ExamProfile()
        {
            CreateMap<SubmitQuestionDto, Question>();
            CreateMap<SubmitExamDto, Exam>()
                .ForMember(dest => dest.Questions, opt => opt.MapFrom(src => src.Questions));

            // Database Entities -> Read DTOs (For Dashboards)
            CreateMap<Exam, ExamHistoryDto>()
                .ForMember(dest => dest.CourseNameEn, opt => opt.MapFrom(src => src.Course.NameEn))
                .ForMember(dest => dest.CourseNameTr, opt => opt.MapFrom(src => src.Course.NameTr));

        }
    }
}
