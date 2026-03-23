namespace GaziStudyAI.Application.DTOs.Course
{
    public class StudentExamSetupDto
    {
        public CourseDto Course { get; set; } = null!;
        public List<int> ValidWeeks { get; set; } = new List<int>();
    }
}
