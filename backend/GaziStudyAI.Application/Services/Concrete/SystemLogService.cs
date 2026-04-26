using GaziStudyAI.Application.DTOs.Admin;
using GaziStudyAI.Application.Services.Abstract;
using System.Collections.Concurrent;

namespace GaziStudyAI.Application.Services.Concrete
{
    public class SystemLogService : ISystemLoggerService
    {
        private readonly ConcurrentQueue<SystemLogDto> _logs = new();
        private const int MaxLogs = 100;

        public void LogError(string action, string details)
        {
            AddLog(action, details, "Error");
        }

        public void LogInfo(string action, string details)
        {
            AddLog(action, details, "Info");
        }

        private void AddLog(string action, string details, string status)
        {
            _logs.Enqueue(new SystemLogDto
            {
                Action = action,
                Details = details,
                Status = status
            });
            while (_logs.Count > MaxLogs)
            {
                _logs.TryDequeue(out _);
            }
        }

        public List<SystemLogDto> GetRecentLogs(int count = 50)
        {
            return _logs.Reverse().Take(count).ToList();
        }
    }
}
