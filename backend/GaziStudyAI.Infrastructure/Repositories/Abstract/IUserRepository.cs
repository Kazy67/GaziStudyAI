using GaziStudyAI.Domain.Entities.Auth;

namespace GaziStudyAI.Infrastructure.Repositories.Abstract
{
    public interface IUserRepository : IGenericRepository<User>
    {
        Task<User?> GetByEmailAsync(string email);
    }
}
