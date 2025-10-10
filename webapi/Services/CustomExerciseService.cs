using System.Data.SQLite;
using System.Text.Json;
using webapi.Models;

namespace webapi.Services
{
    public interface ICustomExerciseService
    {
        void SaveExerciseCompletion(int userId, int exerciseId, string exerciseName, 
            string exerciseType, Dictionary<string, object>? completionData);
        bool HasUserCompletedExercise(int userId, int exerciseId);
        CustomExerciseData? GetExerciseCompletion(int userId, int exerciseId);
        List<CustomExerciseData> GetUserExerciseData(int userId);
    }

    public class CustomExerciseService : ICustomExerciseService
    {
        private readonly string _connectionString;

        public CustomExerciseService(string connectionString)
        {
            _connectionString = connectionString ?? "";
        }

        public void SaveExerciseCompletion(int userId, int exerciseId, string exerciseName, 
            string exerciseType, Dictionary<string, object>? completionData)
        {
            using var conn = new SQLiteConnection(_connectionString);
            conn.Open();

            // First, delete any existing completion record for this user and exercise
            using var deleteCmd = new SQLiteCommand(@"
                DELETE FROM CustomExerciseData 
                WHERE UserId = @UserId AND ExerciseId = @ExerciseId", conn);
            deleteCmd.Parameters.AddWithValue("@UserId", userId);
            deleteCmd.Parameters.AddWithValue("@ExerciseId", exerciseId);
            deleteCmd.ExecuteNonQuery();

            // Then insert the new completion record
            using var cmd = new SQLiteCommand(@"
                INSERT INTO CustomExerciseData (UserId, ExerciseId, ExerciseName, ExerciseType, CompletionData, CompletedAt, CreatedAt) 
                VALUES (@UserId, @ExerciseId, @ExerciseName, @ExerciseType, @CompletionData, @CompletedAt, @CreatedAt)", conn);

            cmd.Parameters.AddWithValue("@UserId", userId);
            cmd.Parameters.AddWithValue("@ExerciseId", exerciseId);
            cmd.Parameters.AddWithValue("@ExerciseName", exerciseName);
            cmd.Parameters.AddWithValue("@ExerciseType", exerciseType);
            cmd.Parameters.AddWithValue("@CompletionData", 
                completionData != null ? JsonSerializer.Serialize(completionData) : null);
            cmd.Parameters.AddWithValue("@CompletedAt", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
            cmd.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));

            cmd.ExecuteNonQuery();
        }

        public bool HasUserCompletedExercise(int userId, int exerciseId)
        {
            using var conn = new SQLiteConnection(_connectionString);
            conn.Open();

            using var cmd = new SQLiteCommand(@"
                SELECT COUNT(*) FROM CustomExerciseData 
                WHERE UserId = @UserId AND ExerciseId = @ExerciseId", conn);
            cmd.Parameters.AddWithValue("@UserId", userId);
            cmd.Parameters.AddWithValue("@ExerciseId", exerciseId);

            var count = Convert.ToInt32(cmd.ExecuteScalar());
            return count > 0;
        }

        public CustomExerciseData? GetExerciseCompletion(int userId, int exerciseId)
        {
            using var conn = new SQLiteConnection(_connectionString);
            conn.Open();

            using var cmd = new SQLiteCommand(@"
                SELECT * FROM CustomExerciseData 
                WHERE UserId = @UserId AND ExerciseId = @ExerciseId
                ORDER BY CompletedAt DESC 
                LIMIT 1", conn);
            
            cmd.Parameters.AddWithValue("@UserId", userId);
            cmd.Parameters.AddWithValue("@ExerciseId", exerciseId);

            using var reader = cmd.ExecuteReader();
            if (reader.Read())
            {
                return new CustomExerciseData
                {
                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                    UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                    ExerciseId = reader.GetInt32(reader.GetOrdinal("ExerciseId")),
                    ExerciseName = reader.GetString(reader.GetOrdinal("ExerciseName")),
                    ExerciseType = reader.GetString(reader.GetOrdinal("ExerciseType")),
                    CompletionData = reader.IsDBNull(reader.GetOrdinal("CompletionData")) ? null : reader.GetString(reader.GetOrdinal("CompletionData")),
                    CompletedAt = DateTime.Parse(reader.GetString(reader.GetOrdinal("CompletedAt"))),
                    CreatedAt = DateTime.Parse(reader.GetString(reader.GetOrdinal("CreatedAt")))
                };
            }

            return null;
        }

        public List<CustomExerciseData> GetUserExerciseData(int userId)
        {
            var exercises = new List<CustomExerciseData>();

            using var conn = new SQLiteConnection(_connectionString);
            conn.Open();

            using var cmd = new SQLiteCommand(@"
                SELECT * FROM CustomExerciseData 
                WHERE UserId = @UserId 
                ORDER BY CompletedAt DESC", conn);
            
            cmd.Parameters.AddWithValue("@UserId", userId);

            using var reader = cmd.ExecuteReader();
            while (reader.Read())
            {
                exercises.Add(new CustomExerciseData
                {
                    Id = reader.GetInt32(reader.GetOrdinal("Id")),
                    UserId = reader.GetInt32(reader.GetOrdinal("UserId")),
                    ExerciseId = reader.GetInt32(reader.GetOrdinal("ExerciseId")),
                    ExerciseName = reader.GetString(reader.GetOrdinal("ExerciseName")),
                    ExerciseType = reader.GetString(reader.GetOrdinal("ExerciseType")),
                    CompletionData = reader.IsDBNull(reader.GetOrdinal("CompletionData")) ? null : reader.GetString(reader.GetOrdinal("CompletionData")),
                    CompletedAt = DateTime.Parse(reader.GetString(reader.GetOrdinal("CompletedAt"))),
                    CreatedAt = DateTime.Parse(reader.GetString(reader.GetOrdinal("CreatedAt")))
                });
            }

            return exercises;
        }
    }
}
