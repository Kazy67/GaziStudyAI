using GaziStudyAI.Common.Entities;

namespace GaziStudyAI.Domain.Entities.Auth
{
    public class UserSettings : BaseEntity
    {
        public Guid UserId { get; set; }

        // Just the essentials for your UI toggle
        public bool IsDarkMode { get; set; } = false;
        public string Language { get; set; } = "tr-TR";

        public virtual User User { get; set; } = null!;
    }
}
