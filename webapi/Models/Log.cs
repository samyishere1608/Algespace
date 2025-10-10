namespace webapi.Models
{
    public class Log
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string ActionType { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}