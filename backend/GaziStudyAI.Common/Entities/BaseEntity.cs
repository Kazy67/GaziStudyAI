namespace GaziStudyAI.Common.Entities
{
    public class BaseEntity
    {
        public BaseEntity()
        {
            CreatedDate = DateTime.UtcNow;
            IsActive = true;
        }

        public virtual Guid Id { get; set; } = Guid.NewGuid(); // to get guid after creation

        // Audit fields
        public virtual Guid? CreatedBy { get; set; }
        public virtual DateTime CreatedDate { get; set; }
        public virtual Guid? UpdatedBy { get; set; }
        public virtual DateTime? UpdatedDate { get; set; }
        public virtual Guid? DeletedBy { get; set; }
        public virtual DateTime? DeletedDate { get; set; }
        public virtual bool IsActive { get; set; }

    }
}
