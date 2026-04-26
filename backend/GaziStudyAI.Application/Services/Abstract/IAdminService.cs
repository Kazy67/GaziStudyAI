using GaziStudyAI.Application.DTOs.Admin;
using GaziStudyAI.Common.Result.Abstract;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface IAdminService
    {
        Task<IResult<AdminDashboardDto>> GetPlatformStatisticsAsync();
        Task<IResult<List<StudentDirectoryItemDto>>> GetAllStudentsAsync();
        Task<IResult<List<SystemLogDto>>> GetSystemLogsAsync();
    }
}
