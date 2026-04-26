namespace GaziStudyAI.Application.DTOs.Admin
{
    public class StudentDirectoryItemDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string StudentNumber { get; set; } = string.Empty;
        public string Department { get; set; } = string.Empty;
        public int TotalExamsTaken { get; set; }
        public DateTime RegisteredDate { get; set; }
    }
}
