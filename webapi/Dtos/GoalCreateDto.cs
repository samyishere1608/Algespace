public class GoalCreateDto
{
  public int UserId { get; set; }
  public string Title { get; set; }
  public string Difficulty { get; set; }
  public string Category { get; set; }
  public int? ConfidenceBefore { get; set; }
  public int? ExpectedMistakes { get; set; }
  public int? MotivationRating { get; set; }
}