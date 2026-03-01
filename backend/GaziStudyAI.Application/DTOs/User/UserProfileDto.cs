namespace GaziStudyAI.Application.DTOs.User
{
    public class UserProfileDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty; // Read-only on the UI
        public string? StudentNumber { get; set; }
        public string? Department { get; set; }
        public string? ProfileImageUrl { get; set; }
    }
}
