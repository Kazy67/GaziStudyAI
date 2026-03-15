using GaziStudyAI.Domain.Entities.Courses;
using GaziStudyAI.Domain.Entities.Exams;
using GaziStudyAI.Domain.Entities.System;
using GaziStudyAI.Infrastructure.Context;
using GaziStudyAI.Infrastructure.Repositories.Abstract;
using GaziStudyAI.Infrastructure.Repositories.Concrete;
using GaziStudyAI.Infrastructure.UnitOfWork.Abstract;

namespace GaziStudyAI.Infrastructure.UnitOfWork.Concrete
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly GaziStudyAIDbContext _context;

        public IUserRepository UserRepository { get; }

        // 👇 Add property
        public IGenericRepository<EmailConfiguration> EmailConfigurationRepository { get; }

        public IGenericRepository<Course> CourseRepository { get; }

        public IGenericRepository<Exam> ExamRepository { get; }

        public UnitOfWork(GaziStudyAIDbContext context)
        {
            _context = context;

            UserRepository = new UserRepository(_context);

            // 👇 Initialize generic repository
            EmailConfigurationRepository = new GenericRepository<EmailConfiguration>(_context);
            CourseRepository = new GenericRepository<Course>(_context);
            ExamRepository = new GenericRepository<Exam>(_context);
        }

        public async Task<int> SaveChangesAsync()
        {
            return await _context.SaveChangesAsync();
        }
    }
}
