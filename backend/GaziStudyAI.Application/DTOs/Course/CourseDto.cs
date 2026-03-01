namespace GaziStudyAI.Application.DTOs.Course
{
    public class CourseDto
    {
        public Guid Id { get; set; }
        public string NameTr { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string DescriptionTr { get; set; } = string.Empty;
        public string DescriptionEn { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public int? Credits { get; set; }
        public string? ImageUrl { get; set; }
        public int YearLevel { get; set; }
        public List<CourseWeekDto> Weeks { get; set; } = new List<CourseWeekDto>();
    }
}
