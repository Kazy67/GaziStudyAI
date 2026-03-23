using Microsoft.AspNetCore.Http;

namespace GaziStudyAI.Application.DTOs.Course
{
    public class UpdateCourseDto
    {
        public Guid Id { get; set; }
        public string Prefix { get; set; } = string.Empty;
        public string NameTr { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string DescriptionTr { get; set; } = string.Empty;
        public string DescriptionEn { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public int? Credits { get; set; }
        public int YearLevel { get; set; }

        // AI Settings
        public bool AllowTheoryQuestions { get; set; }
        public bool AllowCodeQuestions { get; set; }
        public bool AllowMathQuestions { get; set; }

        public IFormFile? Image { get; set; } // Nullable: If null, we keep the old image
        public string? WeeksJson { get; set; }
    }
}
