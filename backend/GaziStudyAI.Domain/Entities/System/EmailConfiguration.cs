using GaziStudyAI.Common.Entities;

namespace GaziStudyAI.Domain.Entities.System
{
    public class EmailConfiguration : BaseEntity
    {
        public string SmtpServer { get; set; } = "smtp.gmail.com";
        public int Port { get; set; } = 587;
        public string SenderEmail { get; set; } = string.Empty; // yourproject@gmail.com
        public string SenderPassword { get; set; } = string.Empty; // The App Password
        public bool EnableSsl { get; set; } = true;
    }
}
