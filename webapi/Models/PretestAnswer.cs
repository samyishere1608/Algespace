using System.ComponentModel.DataAnnotations;

namespace webapi.Models
{
    public class PretestAnswer
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public string Answers { get; set; } = string.Empty; // JSON string
        public string SuggestedGoals { get; set; } = string.Empty; // JSON string
        public DateTime CompletedAt { get; set; }
    }
}
