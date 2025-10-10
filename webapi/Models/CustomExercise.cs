namespace webapi.Models
{
    public class CustomExerciseData
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public string ExerciseType { get; set; } = string.Empty;
        public string? CompletionData { get; set; }
        public DateTime CompletedAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }
}
