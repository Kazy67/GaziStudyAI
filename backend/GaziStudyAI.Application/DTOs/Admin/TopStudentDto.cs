namespace GaziStudyAI.Application.DTOs.Admin
{
    public class TopStudentDto
    {
        public string FullName { get; set; } = string.Empty;
        public int ExamsTaken { get; set; }
        public double AverageScore { get; set; }
    }
}
