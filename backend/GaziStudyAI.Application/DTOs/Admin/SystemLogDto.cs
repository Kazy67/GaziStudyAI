namespace GaziStudyAI.Application.DTOs.Admin
{
    public class SystemLogDto
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
        public string Action { get; set; } = string.Empty;     // e.g., "AI Exam Generation"
        public string Details { get; set; } = string.Empty;    // e.g., "Generated 5 questions for VP"
        public string Status { get; set; } = "Success";        // "Success", "Warning", "Error"
    }
}
