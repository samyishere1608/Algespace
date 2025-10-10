using System.Data.SQLite;
using webapi.Models;
using webapi.Helpers;


namespace webapi.Services
{
  public class GoalService : IGoalService
    {
        private readonly string _connectionString;

        public GoalService(string connectionString)
        {
            _connectionString = connectionString;
        }

        public Goal CreateGoal(Goal goal)
        {
            // Use retry helper to handle "database is locked" errors during concurrent access
            return SQLiteRetryHelper.ExecuteWithRetry(() =>
            {
                using var conn = new SQLiteConnection(_connectionString);
                conn.Open();

                using var cmd = new SQLiteCommand(@"
    INSERT INTO Goals (
        UserId, Title, Difficulty, CreatedAt, Category, Completed, MotivationRating, ConfidenceBefore,
        ExpectedMistakes, ActualScore, GoalAchieved,
        PostSatisfaction, PostConfidence, PostEffort, PostEnjoyment, PostAnxiety
    ) VALUES (
        @UserId, @Title, @Difficulty, @CreatedAt, @Category, @Completed, @MotivationRating, @ConfidenceBefore,
        @ExpectedMistakes, @ActualScore, @GoalAchieved,
        @PostSatisfaction, @PostConfidence, @PostEffort, @PostEnjoyment, @PostAnxiety
    );
    SELECT last_insert_rowid();
", conn);

                cmd.Parameters.AddWithValue("@UserId", goal.UserId);
                cmd.Parameters.AddWithValue("@Title", goal.Title);
                cmd.Parameters.AddWithValue("@Difficulty", goal.Difficulty);
                cmd.Parameters.AddWithValue("@CreatedAt", DateTime.UtcNow);
                cmd.Parameters.AddWithValue("@Category", goal.Category);
                cmd.Parameters.AddWithValue("@Completed", goal.Completed);
                cmd.Parameters.AddWithValue("@MotivationRating", goal.MotivationRating ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ConfidenceBefore", goal.ConfidenceBefore ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ExpectedMistakes", goal.ExpectedMistakes ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@ActualScore", goal.ActualScore ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@GoalAchieved", goal.GoalAchieved ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PostSatisfaction", goal.PostSatisfaction ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PostConfidence", goal.PostConfidence ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PostEffort", goal.PostEffort ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PostEnjoyment", goal.PostEnjoyment ?? (object)DBNull.Value);
                cmd.Parameters.AddWithValue("@PostAnxiety", goal.PostAnxiety ?? (object)DBNull.Value);

                long id = (long)cmd.ExecuteScalar();
                goal.Id = (int)id;
                goal.CreatedAt = DateTime.UtcNow;
                return goal;
            });
        }

        public List<Goal> GetGoalsByUser(int userId)
        {
            // Use retry helper to handle "database is locked" errors during concurrent access
            return SQLiteRetryHelper.ExecuteWithRetry(() =>
            {
                var goals = new List<Goal>();

                using var conn = new SQLiteConnection(_connectionString);
                conn.Open();

                using var cmd = new SQLiteCommand("SELECT * FROM Goals WHERE UserId = @UserId", conn);
                cmd.Parameters.AddWithValue("@UserId", userId);
                using var reader = cmd.ExecuteReader();

                while (reader.Read())
                {
                    goals.Add(new Goal
                    {
                        Id = reader.GetInt32(0),
                        UserId = reader.GetInt32(1),
                        Title = reader.GetString(2),
                        Difficulty = reader.GetString(3),
                        CreatedAt = DateTime.Parse(reader.GetString(4)),
                        UpdatedAt = reader.IsDBNull(5) ? null : DateTime.Parse(reader.GetString(5)),
                      Completed = reader.GetInt32(6) == 1 ? 1 : 0 , // or just reader.GetInt32(6)
                      MotivationRating = reader.IsDBNull(7) ? null : reader.GetInt32(7),
                      Category = reader.GetString(reader.GetOrdinal("Category")),
                      ConfidenceBefore = reader.IsDBNull(reader.GetOrdinal("ConfidenceBefore")) ? null : reader.GetInt32(reader.GetOrdinal("ConfidenceBefore")),
                      ExpectedMistakes = reader.IsDBNull(reader.GetOrdinal("ExpectedMistakes")) 
    ? null : reader.GetInt32(reader.GetOrdinal("ExpectedMistakes")),
ActualScore = reader.IsDBNull(reader.GetOrdinal("ActualScore")) 
    ? null : reader.GetDouble(reader.GetOrdinal("ActualScore")),
GoalAchieved = reader.IsDBNull(reader.GetOrdinal("GoalAchieved")) 
    ? null : reader.GetInt32(reader.GetOrdinal("GoalAchieved")),
    HintsUsed = reader.IsDBNull(reader.GetOrdinal("HintsUsed")) ? null : reader.GetInt32(reader.GetOrdinal("HintsUsed")),
    ErrorsMade = reader.IsDBNull(reader.GetOrdinal("ErrorsMade")) ? null : reader.GetInt32(reader.GetOrdinal("ErrorsMade")),
    PostSatisfaction = reader.IsDBNull(reader.GetOrdinal("PostSatisfaction"))
    ? null : reader.GetInt32(reader.GetOrdinal("PostSatisfaction")),
PostConfidence = reader.IsDBNull(reader.GetOrdinal("PostConfidence"))
    ? null : reader.GetInt32(reader.GetOrdinal("PostConfidence")),
                        PostEffort = reader.IsDBNull(reader.GetOrdinal("PostEffort")) ? null : reader.GetInt32(reader.GetOrdinal("PostEffort")),
                        PostEnjoyment = reader.IsDBNull(reader.GetOrdinal("PostEnjoyment")) ? null : reader.GetInt32(reader.GetOrdinal("PostEnjoyment")),
                        PostAnxiety = reader.IsDBNull(reader.GetOrdinal("PostAnxiety")) ? null : reader.GetInt32(reader.GetOrdinal("PostAnxiety"))
                    });
                }

                return goals;
            });
        }

        public bool UpdateGoal(int id, Goal updatedGoal)
{
    // Use retry helper to handle "database is locked" errors during concurrent access
    return SQLiteRetryHelper.ExecuteWithRetry(() =>
    {
        using var conn = new SQLiteConnection(_connectionString);
        conn.Open();

        using var cmd = new SQLiteCommand(@"
    UPDATE Goals
    SET Title = @Title, Difficulty = @Difficulty, Category = @Category, UpdatedAt = @UpdatedAt
    WHERE Id = @Id
", conn);

        cmd.Parameters.AddWithValue("@Title", updatedGoal.Title);
        cmd.Parameters.AddWithValue("@Difficulty", updatedGoal.Difficulty);
        cmd.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
        cmd.Parameters.AddWithValue("@Id", id);
        
        cmd.Parameters.AddWithValue("@Category", updatedGoal.Category);

        int affectedRows = cmd.ExecuteNonQuery();
        return affectedRows > 0;
    });
}

public Goal GetGoalById(int id)
{
    // Use retry helper to handle "database is locked" errors during concurrent access
    return SQLiteRetryHelper.ExecuteWithRetry(() =>
    {
        using var conn = new SQLiteConnection(_connectionString);
        conn.Open();

        using var cmd = new SQLiteCommand("SELECT * FROM Goals WHERE Id = @Id", conn);
        cmd.Parameters.AddWithValue("@Id", id);
        using var reader = cmd.ExecuteReader();

        if (reader.Read())
        {
            return new Goal
            {
                Id = reader.GetInt32(0),
                UserId = reader.GetInt32(1),
                Title = reader.GetString(2),
                Difficulty = reader.GetString(3),
                CreatedAt = DateTime.Parse(reader.GetString(4)),
                UpdatedAt = reader.IsDBNull(5) ? null : DateTime.Parse(reader.GetString(5)),
                Completed = reader.IsDBNull(6) ? 0 : reader.GetInt32(6) ,// assuming 'Completed' is the 7th column (index 6)
                MotivationRating = reader.IsDBNull(7) ? null : reader.GetInt32(7),
                Category = reader.GetString(reader.GetOrdinal("Category")),
               ConfidenceBefore = reader.IsDBNull(reader.GetOrdinal("ConfidenceBefore")) ? null : reader.GetInt32(reader.GetOrdinal("ConfidenceBefore")),
                ExpectedMistakes = reader.IsDBNull(reader.GetOrdinal("ExpectedMistakes")) 
    ? null : reader.GetInt32(reader.GetOrdinal("ExpectedMistakes")),
ActualScore = reader.IsDBNull(reader.GetOrdinal("ActualScore")) 
    ? null : reader.GetDouble(reader.GetOrdinal("ActualScore")),
GoalAchieved = reader.IsDBNull(reader.GetOrdinal("GoalAchieved")) 
    ? null : reader.GetInt32(reader.GetOrdinal("GoalAchieved")),
    HintsUsed = reader.IsDBNull(reader.GetOrdinal("HintsUsed")) ? null : reader.GetInt32(reader.GetOrdinal("HintsUsed")),
    ErrorsMade = reader.IsDBNull(reader.GetOrdinal("ErrorsMade")) ? null : reader.GetInt32(reader.GetOrdinal("ErrorsMade")),
    PostSatisfaction = reader.IsDBNull(reader.GetOrdinal("PostSatisfaction"))
    ? null : reader.GetInt32(reader.GetOrdinal("PostSatisfaction")),
PostConfidence = reader.IsDBNull(reader.GetOrdinal("PostConfidence"))
    ? null : reader.GetInt32(reader.GetOrdinal("PostConfidence")),
    PostEffort = reader.IsDBNull(reader.GetOrdinal("PostEffort")) ? null : reader.GetInt32(reader.GetOrdinal("PostEffort")),
    PostEnjoyment = reader.IsDBNull(reader.GetOrdinal("PostEnjoyment")) ? null : reader.GetInt32(reader.GetOrdinal("PostEnjoyment")),
    PostAnxiety = reader.IsDBNull(reader.GetOrdinal("PostAnxiety")) ? null : reader.GetInt32(reader.GetOrdinal("PostAnxiety"))
            };
        }

        throw new Exception("Goal not found");
    });
}
public bool DeleteGoal(int id)
{
    // Use retry helper to handle "database is locked" errors during concurrent access
    return SQLiteRetryHelper.ExecuteWithRetry(() =>
    {
        using var conn = new SQLiteConnection(_connectionString);
        conn.Open();

        using var cmd = new SQLiteCommand("DELETE FROM Goals WHERE Id = @Id", conn);
        cmd.Parameters.AddWithValue("@Id", id);

        int affectedRows = cmd.ExecuteNonQuery();
        return affectedRows > 0;
    });
}

// Update the MarkGoalAsCompleted method signature to match the interface
public bool MarkGoalAsCompleted(int id, double? actualScore, int? hintsUsed, int? errorsMade,
    int? postSatisfaction, int? postConfidence, 
    int? postEffort, int? postEnjoyment, int? postAnxiety)
{
    // Use retry helper to handle "database is locked" errors during concurrent access
    return SQLiteRetryHelper.ExecuteWithRetry(() =>
    {
        using var conn = new SQLiteConnection(_connectionString);
        conn.Open();

        int? goalAchieved = null;
        if (actualScore.HasValue)
        {
            goalAchieved = (actualScore.Value >= 0.7) ? 1 : 0; 
        }

        using var cmd = new SQLiteCommand(@"
            UPDATE Goals 
            SET Completed = 1, 
                ActualScore = @ActualScore,
                HintsUsed = @HintsUsed,
                ErrorsMade = @ErrorsMade,
                PostSatisfaction = @PostSatisfaction,
                PostConfidence = @PostConfidence,
                PostEffort = @PostEffort,
                PostEnjoyment = @PostEnjoyment,
                PostAnxiety = @PostAnxiety,
                UpdatedAt = @UpdatedAt,
                GoalAchieved = @GoalAchieved
            WHERE Id = @Id
        ", conn);

        cmd.Parameters.AddWithValue("@ActualScore", actualScore ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@HintsUsed", hintsUsed ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@ErrorsMade", errorsMade ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@PostSatisfaction", postSatisfaction ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@PostConfidence", postConfidence ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@PostEffort", postEffort ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@PostEnjoyment", postEnjoyment ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@PostAnxiety", postAnxiety ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@UpdatedAt", DateTime.UtcNow);
        cmd.Parameters.AddWithValue("@GoalAchieved", goalAchieved ?? (object)DBNull.Value);
        cmd.Parameters.AddWithValue("@Id", id);

        return cmd.ExecuteNonQuery() > 0;
    });
}

public bool SaveMotivationRating(int id, int rating)
{
    // Use retry helper to handle "database is locked" errors during concurrent access
    return SQLiteRetryHelper.ExecuteWithRetry(() =>
    {
        using var conn = new SQLiteConnection(_connectionString);
        conn.Open();

        using var cmd = new SQLiteCommand("UPDATE Goals SET MotivationRating = @Rating WHERE Id = @Id", conn);
        cmd.Parameters.AddWithValue("@Rating", rating);
        cmd.Parameters.AddWithValue("@Id", id);

        return cmd.ExecuteNonQuery() > 0;
    });
}
    }


}

