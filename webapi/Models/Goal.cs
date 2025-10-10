namespace webapi.Models
{
    public class Goal
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Title { get; set; }
        public string Difficulty { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public int Completed { get; set; }
        public int? MotivationRating { get; set; }
        public string Category { get; set; }
        
        // Pre-goal assessment
        public int? ConfidenceBefore { get; set; }
        public int? ExpectedMistakes { get; set; }
        
        // Goal completion metrics
        public double? ActualScore { get; set; }  // Number of errors/mistakes made
        public int? GoalAchieved { get; set; }
        public int? HintsUsed { get; set; }  // Number of hints used during the exercise
        public int? ErrorsMade { get; set; }  // Number of errors made (for tracking)
        
        // Post-goal emotional reflection
        public int? PostSatisfaction { get; set; }
        public int? PostConfidence { get; set; }
        public int? PostEffort { get; set; }
        public int? PostEnjoyment { get; set; }
        public int? PostAnxiety { get; set; }
    }

    public class MotivationDto
{
    public int Rating { get; set; }
}
}
