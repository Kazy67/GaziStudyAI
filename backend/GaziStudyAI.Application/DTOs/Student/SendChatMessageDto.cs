namespace GaziStudyAI.Application.DTOs.Student
{
    public class SendChatMessageDto
    {
        public Guid CourseId { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
