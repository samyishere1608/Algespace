namespace webapi.Dtos
{
    public class ExerciseCompletionDto
    {
        public int UserId { get; set; }
        public int ExerciseId { get; set; }
        public string ExerciseName { get; set; } = string.Empty;
        public string ExerciseType { get; set; } = string.Empty;
        public Dictionary<string, object>? CompletionData { get; set; }
    }

    public class ExerciseStatusDto
    {
        public bool HasCompleted { get; set; }
        public DateTime? CompletedAt { get; set; }
        public Dictionary<string, object>? CompletionData { get; set; }
    }

    public class ExerciseCompletionResultDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
