using GaziStudyAI.Application.DTOs.Admin;

namespace GaziStudyAI.Application.Services.Abstract
{
    public interface ISystemLoggerService
    {
        void LogInfo(string action, string details);
        void LogError(string action, string details);
        List<SystemLogDto> GetRecentLogs(int count = 50);
    }
}
