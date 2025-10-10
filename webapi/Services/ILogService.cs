using webapi.Models;

namespace webapi.Services
{
    public interface ILogService
    {
        void LogAction(Log entry);
        List<Log> GetLogsForUser(int userId);
    }
}
