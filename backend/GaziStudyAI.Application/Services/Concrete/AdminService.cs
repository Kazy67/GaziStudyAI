using GaziStudyAI.Application.DTOs.Admin;
using GaziStudyAI.Application.Services.Abstract;
using GaziStudyAI.Common.Result.Abstract;
using GaziStudyAI.Common.Result.Concrete;
using GaziStudyAI.Domain.Enums;
using GaziStudyAI.Infrastructure.UnitOfWork.Abstract;
using Microsoft.EntityFrameworkCore;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class AdminService : IAdminService
    {
        private readonly IUnitOfWork _uow;

        public AdminService(IUnitOfWork uow)
        {
            _uow = uow;
        }
        public async Task<IResult<AdminDashboardDto>> GetPlatformStatisticsAsync()
        {
            try
            {
                // 1. Get total students using your user repository
                var studentsCount = await _uow.UserRepository.GetQueryable()
                    .CountAsync(u => u.Role == UserRole.Student);

                // 2. Get all completed exams with course names
                var allExams = await _uow.ExamRepository.GetQueryable()
                    .Include(e => e.Course)
                    .Include(e => e.User)
                    .Where(e => e.IsCompleted)
                    .ToListAsync();

                // 3. Calculate statistics
                var stats = new AdminDashboardDto
                {
                    TotalStudents = studentsCount,
                    TotalExamsGenerated = allExams.Count,
                    AveragePlatformScore = allExams.Any() ? allExams.Average(e => e.Score ?? 0) : 0,

                    // Group by Course Name to see which courses are most popular
                    CourseStatistics = allExams
                        .GroupBy(e => e.Course.NameEn)
                        .Select(g => new CourseStatsDto
                        {
                            CourseName = g.Key,
                            ExamsTaken = g.Count(),
                            AverageScore = g.Average(e => e.Score ?? 0)
                        }).ToList(),

                    TopStudents = allExams
                        .GroupBy(e => new { e.User.FirstName, e.User.LastName })
                        .Select(g => new TopStudentDto
                        {
                            FullName = $"{g.Key.FirstName} {g.Key.LastName}",
                            ExamsTaken = g.Count(),
                            AverageScore = g.Average(e => e.Score ?? 0)
                        })
                        .OrderByDescending(s => s.ExamsTaken) // Order by who took the most exams
                        .Take(5) // Just take the top 5 for the dashboard
                        .ToList()
                };

                return ServiceResult<AdminDashboardDto>.Success(stats);
            }
            catch (Exception ex)
            {
                return ServiceResult<AdminDashboardDto>.Failure($"Failed to load admin stats: {ex.Message}");
            }
        }
    }
}
