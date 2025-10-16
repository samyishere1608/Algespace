using System.Data.SQLite;
using System.Text.Json;
using webapi.Models;
using webapi.Helpers;

namespace webapi.Services
{
    public interface IPretestService
    {
        void SavePretestAnswers(int userId, Dictionary<string, string> answers, List<string> suggestedGoals);
        bool HasUserCompletedPretest(int userId);
        List<string> GetUserSuggestedGoals(int userId);
        Dictionary<string, string> GetUserPretestAnswers(int userId);
    }

    public class PretestService : IPretestService
    {
        private readonly string _connectionString;

        public PretestService(IConfiguration configuration)
        {
            _connectionString = configuration.GetConnectionString("DefaultConnection") ?? "";
        }

        public void SavePretestAnswers(int userId, Dictionary<string, string> answers, List<string> suggestedGoals)
        {
            SQLiteRetryHelper.ExecuteWithRetry(() =>
            {
                using var conn = new SQLiteConnection(_connectionString);
                conn.Open();

                // First, delete any existing entries for this user to ensure only one completion record
                using var deleteCmd = new SQLiteCommand("DELETE FROM PretestAnswers WHERE UserId = @UserId", conn);
                deleteCmd.Parameters.AddWithValue("@UserId", userId);
                deleteCmd.ExecuteNonQuery();

                // Then insert the new completion record
                using var cmd = new SQLiteCommand(@"
                    INSERT INTO PretestAnswers (UserId, Answers, SuggestedGoals, CompletedAt) 
                    VALUES (@UserId, @Answers, @SuggestedGoals, @CompletedAt)", conn);

                cmd.Parameters.AddWithValue("@UserId", userId);
                cmd.Parameters.AddWithValue("@Answers", JsonSerializer.Serialize(answers));
                cmd.Parameters.AddWithValue("@SuggestedGoals", JsonSerializer.Serialize(suggestedGoals));
                cmd.Parameters.AddWithValue("@CompletedAt", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

                cmd.ExecuteNonQuery();
            });
        }

        public bool HasUserCompletedPretest(int userId)
        {
            return SQLiteRetryHelper.ExecuteWithRetry(() =>
            {
                using var conn = new SQLiteConnection(_connectionString);
                conn.Open();

                using var cmd = new SQLiteCommand("SELECT COUNT(*) FROM PretestAnswers WHERE UserId = @UserId", conn);
                cmd.Parameters.AddWithValue("@UserId", userId);

                var count = Convert.ToInt32(cmd.ExecuteScalar());
                Console.WriteLine($"[DEBUG] HasUserCompletedPretest - UserId: {userId}, Count: {count}");
                return count > 0;
            });
        }

        public List<string> GetUserSuggestedGoals(int userId)
        {
            return SQLiteRetryHelper.ExecuteWithRetry(() =>
            {
                using var conn = new SQLiteConnection(_connectionString);
                conn.Open();

                using var cmd = new SQLiteCommand(@"
                    SELECT SuggestedGoals FROM PretestAnswers 
                    WHERE UserId = @UserId 
                    ORDER BY CompletedAt DESC 
                    LIMIT 1", conn);
                
                cmd.Parameters.AddWithValue("@UserId", userId);

                var result = cmd.ExecuteScalar()?.ToString();
                Console.WriteLine($"[DEBUG] GetUserSuggestedGoals - UserId: {userId}, Raw result: {result}");
                
                if (string.IsNullOrEmpty(result))
                {
                    Console.WriteLine($"[DEBUG] No suggested goals found for user {userId}");
                    return new List<string>();
                }

                try
                {
                    var goals = JsonSerializer.Deserialize<List<string>>(result) ?? new List<string>();
                    Console.WriteLine($"[DEBUG] Deserialized goals count: {goals.Count}");
                    foreach (var goal in goals)
                    {
                        Console.WriteLine($"[DEBUG] Goal: {goal}");
                    }
                    return goals;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DEBUG] Error deserializing goals: {ex.Message}");
                    return new List<string>();
                }
            });
        }

        public Dictionary<string, string> GetUserPretestAnswers(int userId)
        {
            return SQLiteRetryHelper.ExecuteWithRetry(() =>
            {
                using var conn = new SQLiteConnection(_connectionString);
                conn.Open();

                using var cmd = new SQLiteCommand(@"
                    SELECT Answers FROM PretestAnswers 
                    WHERE UserId = @UserId 
                    ORDER BY CompletedAt DESC 
                    LIMIT 1", conn);
                
                cmd.Parameters.AddWithValue("@UserId", userId);

                var result = cmd.ExecuteScalar()?.ToString();
                
                if (string.IsNullOrEmpty(result))
                {
                    return new Dictionary<string, string>();
                }

                try
                {
                    return JsonSerializer.Deserialize<Dictionary<string, string>>(result) ?? new Dictionary<string, string>();
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[DEBUG] Error deserializing pretest answers: {ex.Message}");
                    return new Dictionary<string, string>();
                }
            });
        }
    }
}
