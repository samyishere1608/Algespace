using System.Data.SQLite;
using webapi.Models;
using System.Collections.Generic;
using System;
using webapi.Helpers;

namespace webapi.Services
{
    public class LogService : ILogService
    {
        private readonly string _connectionString;

        public LogService(string connectionString)
        {
            _connectionString = connectionString;
        }

      public void LogAction(Log entry)
{
    // Use retry helper to handle "database is locked" errors during concurrent access
    SQLiteRetryHelper.ExecuteWithRetry(() =>
    {
        using var conn = new SQLiteConnection(_connectionString);
        conn.Open();

        using var cmd = new SQLiteCommand(@"
            INSERT INTO Logs (UserId, ActionType, Timestamp, Description)
            VALUES (@UserId, @ActionType, @Timestamp, @Description)
        ", conn);

        cmd.Parameters.AddWithValue("@UserId", entry.UserId);
        cmd.Parameters.AddWithValue("@ActionType", entry.ActionType);
        cmd.Parameters.AddWithValue("@Timestamp", entry.Timestamp);
        cmd.Parameters.AddWithValue("@Description", entry.Description ?? (object)DBNull.Value);

        cmd.ExecuteNonQuery();
    });
}
        public List<Log> GetLogsForUser(int userId)
        {
            var logs = new List<Log>();

            using var conn = new SQLiteConnection(_connectionString);
            conn.Open();

            using var cmd = new SQLiteCommand("SELECT * FROM Logs WHERE UserId = @UserId", conn);
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                logs.Add(new Log
                {
                    Id = reader.GetInt32(0),
                    UserId = reader.GetInt32(1),
                    ActionType = reader.GetString(2),
                   Timestamp = DateTime.Parse(reader.GetString(4)),
                    Description = reader.IsDBNull(4) ? null : reader.GetString(4)
                });
            }

            return logs;
        }
    }
}
