using GaziStudyAI.Common.Entities;
using GaziStudyAI.Domain.Entities.Exams;

namespace GaziStudyAI.Domain.Entities.Courses
{
    public class Course : BaseEntity
    {
        public string Prefix { get; set; } = string.Empty;
        public string NameTr { get; set; } = string.Empty;
        public string NameEn { get; set; } = string.Empty;
        public string DescriptionTr { get; set; } = string.Empty;
        public string DescriptionEn { get; set; } = string.Empty;
        public string TeacherName { get; set; } = string.Empty;
        public int? Credits { get; set; } // AKTS value
        public string? ImageUrl { get; set; } // URL for the course banner image
        public int YearLevel { get; set; } // 1, 2, 3, or 4

        public bool AllowTheoryQuestions { get; set; } = true; // Default to true
        public bool AllowCodeQuestions { get; set; } = false;
        public bool AllowMathQuestions { get; set; } = false;

        // Navigation Properties
        public virtual ICollection<CourseWeek> Weeks { get; set; } = new List<CourseWeek>();
        public virtual ICollection<Exam> Exams { get; set; } = new List<Exam>();
        public virtual ICollection<StudentCourse> StudentCourses { get; set; } = new List<StudentCourse>();
    }
}
