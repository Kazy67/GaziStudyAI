using GaziStudyAI.Domain.Entities.Auth;
using GaziStudyAI.Infrastructure.Context;
using GaziStudyAI.Infrastructure.Repositories.Abstract;
using Microsoft.EntityFrameworkCore;

namespace GaziStudyAI.Infrastructure.Repositories.Concrete
{
    public class UserRepository : GenericRepository<User>, IUserRepository
    {
        public UserRepository(GaziStudyAIDbContext context) : base(context)
        {
        }
        public async Task<User?> GetByEmailAsync(string email)
        {
            return await _context.Users.FirstOrDefaultAsync(u => u.Email == email);
        }
    }
}
