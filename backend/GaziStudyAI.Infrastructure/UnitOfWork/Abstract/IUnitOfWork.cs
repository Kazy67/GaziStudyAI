using GaziStudyAI.Domain.Entities.Courses;
using GaziStudyAI.Domain.Entities.Exams;
using GaziStudyAI.Domain.Entities.System;
using GaziStudyAI.Infrastructure.Repositories.Abstract;

namespace GaziStudyAI.Infrastructure.UnitOfWork.Abstract
{
    public interface IUnitOfWork
    {
        IUserRepository UserRepository { get; }
        IGenericRepository<EmailConfiguration> EmailConfigurationRepository { get; }
        IGenericRepository<Course> CourseRepository { get; }
        IGenericRepository<Exam> ExamRepository { get; }
        Task<int> SaveChangesAsync();
    }
}
