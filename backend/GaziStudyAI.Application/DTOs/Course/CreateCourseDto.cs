using Microsoft.AspNetCore.Http;

namespace GaziStudyAI.Application.DTOs.Course
{
    public class CreateCourseDto
    {
        public string NameTr { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string DescriptionTr { get; set; } = string.Empty;
        public string DescriptionEn { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public int? Credits { get; set; }
        public int YearLevel { get; set; }
        public IFormFile? Image { get; set; }
        public string? WeeksJson { get; set; }
    }
}
