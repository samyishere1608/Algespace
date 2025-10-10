namespace webapi.Dtos
{
    public class PretestSubmissionDto
    {
        public int UserId { get; set; }
        public Dictionary<string, string> Answers { get; set; } = new();
    }

    public class PretestStatusDto
    {
        public bool HasCompleted { get; set; }
        public List<string> SuggestedGoals { get; set; } = new();
    }

    public class PretestResultDto
    {
        public bool Success { get; set; }
        public List<string> SuggestedGoals { get; set; } = new();
        public string Message { get; set; } = string.Empty;
    }
}
