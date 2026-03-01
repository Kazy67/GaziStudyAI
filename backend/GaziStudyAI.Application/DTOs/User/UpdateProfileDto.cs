using Microsoft.AspNetCore.Http;

namespace GaziStudyAI.Application.DTOs.User
{
    public class UpdateProfileDto
    {
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string? StudentNumber { get; set; }
        public string? Department { get; set; }

        // The file is optional! They might just update their name without changing the photo.
        public IFormFile? ProfileImage { get; set; }
        public bool RemoveExistingImage { get; set; } = false;
    }
}
