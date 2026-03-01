namespace GaziStudyAI.Application.DTOs.Auth
{
    public class AuthResponseDto
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public string Token { get; set; }
        public bool IsVerified { get; set; }
    }
}
