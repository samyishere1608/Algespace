using Microsoft.AspNetCore.Mvc;
using webapi.Models;    // ✅ use your actual namespace
using webapi.Services;  // ✅ use your actual namespace
using webapi.Dtos;
using DtoMotivationDto = webapi.Dtos.MotivationDto; 
namespace webapi.Controllers  // ✅ add this if it's missing
{
    [ApiController]
    [Route("api/[controller]")]
    public class GoalsController : ControllerBase
    {
        private readonly IGoalService _goalService;
        private readonly ILogService _logService;
        private readonly IPretestService _pretestService;

    public GoalsController(IGoalService goalService, ILogService logService, IPretestService pretestService)
    {
        _goalService = goalService;
        _logService = logService;
        _pretestService = pretestService;
    }


       [HttpPost]
public IActionResult Create([FromBody] GoalCreateDto dto)
{
    var goal = new Goal {
       UserId = dto.UserId,
       Title = dto.Title,
       Difficulty = dto.Difficulty,
       Category = dto.Category,
       ConfidenceBefore = dto.ConfidenceBefore,
       ExpectedMistakes = dto.ExpectedMistakes,
       MotivationRating = dto.MotivationRating,
       CreatedAt = DateTime.UtcNow
    };
    var created = _goalService.CreateGoal(goal);
    _logService.LogAction(new Log {
      UserId = goal.UserId,
      ActionType = "GoalCreated",
      Description = $"Created goal '{goal.Title}' diff:{goal.Difficulty} confidence:{goal.ConfidenceBefore} expectedMistakes:{goal.ExpectedMistakes}"
    });
    return Ok(created);
}
        [HttpGet("user/{userId}")]
        public IActionResult GetGoals(int userId)
        {
            var goals = _goalService.GetGoalsByUser(userId);
            return Ok(goals);
        }

        [HttpPut("{id}")]
public IActionResult Update(int id, [FromBody] Goal updatedGoal)
{
    var success = _goalService.UpdateGoal(id, updatedGoal);
    if (!success)
        return NotFound();

    
    _logService.LogAction(new Log {
        UserId = updatedGoal.UserId,
        ActionType = "GoalUpdated",
        Description = $"Updated goal to '{updatedGoal.Title}'in category '{updatedGoal.Category}' with difficulty '{updatedGoal.Difficulty}'"
    });

    return Ok(updatedGoal);
}

[HttpDelete("{id}")]
public IActionResult Delete(int id)
{
    var goal = _goalService.GetGoalById(id); 
    if (goal == null)
        return NotFound();

    var success = _goalService.DeleteGoal(id);  
    if (!success)
        return StatusCode(500, "Failed to delete goal");  

   
    _logService.LogAction(new Log
    {
        UserId = goal.UserId,
        ActionType = "GoalDeleted",
        Description = $"Deleted goal '{goal.Title}' (Category: '{goal.Category}', Difficulty: '{goal.Difficulty}')"
    });

    return NoContent();  // ✅ Done
}

[HttpPatch("{id}/complete")]
public IActionResult MarkAsComplete(int id, [FromBody] CompleteGoalDto dto)
{
    // Get the goal first to access UserId
    var goal = _goalService.GetGoalById(id);
    if (goal == null) return NotFound();

    // Add logging to debug the received values
    _logService.LogAction(new Log {
        UserId = goal.UserId,
        ActionType = "GoalCompletionAttempt",
        Description = $"Attempting to complete goal '{goal.Title}' (ID: {id}) with values: Satisfaction:{dto.PostSatisfaction}, Confidence:{dto.PostConfidence}, Effort:{dto.PostEffort}, Enjoyment:{dto.PostEnjoyment}, Anxiety:{dto.PostAnxiety}, ActualScore:{dto.ActualScore}, HintsUsed:{dto.HintsUsed}, ErrorsMade:{dto.ErrorsMade}"
    });

    var success = _goalService.MarkGoalAsCompleted(
        id, 
        dto.ActualScore,
        dto.HintsUsed,
        dto.ErrorsMade,
        dto.PostSatisfaction,
        dto.PostConfidence, 
        dto.PostEffort, 
        dto.PostEnjoyment, 
        dto.PostAnxiety
    );

    if (!success) return NotFound();

    _logService.LogAction(new Log {
        UserId = goal.UserId,
        ActionType = "GoalCompleted",
        Description = $"Completed goal '{goal.Title}' (ID: {id}) with satisfaction:{dto.PostSatisfaction} confidence:{dto.PostConfidence} effort:{dto.PostEffort} enjoyment:{dto.PostEnjoyment} anxiety:{dto.PostAnxiety}"
    });
    
    return Ok(goal);
}

[HttpPost("{id}/motivation")]
public IActionResult SubmitMotivation(int id, [FromBody] DtoMotivationDto dto)
{
    var success = _goalService.SaveMotivationRating(id, dto.Rating);
    if (!success) return NotFound();

    var goal = _goalService.GetGoalById(id);  // fetch goal to log

    _logService.LogAction(new Log {
        UserId = goal.UserId,
        ActionType = "MotivationRated",
        Description = $"Rated motivation {dto.Rating} for goal '{goal.Title}'"
    });

    return Ok();
}

[HttpPost("{id}/log-reason")]
public IActionResult LogReason(int id, [FromBody] ReasonDto dto)
{
    var goal = _goalService.GetGoalById(id);
    if (goal == null) return NotFound();

    _logService.LogAction(new Log
    {
        UserId = goal.UserId,
        ActionType = $"Goal{dto.Action}Reason",
        Description = $"Reason for {dto.Action}: '{dto.Reason}'"
    });

    return Ok();
}
// [HttpPost("{id}/feedback-shown")]
// public IActionResult LogFeedbackShown(int id, [FromBody] FeedbackDto dto)
// {
//     var goal = _goalService.GetGoalById(id);
//     if (goal == null) return NotFound();

//     _logService.LogAction(new Log {
//       UserId = goal.UserId,
//       ActionType = "FeedbackShown",
//       Description = $"FeedbackType:{dto.Type} Message:{dto.Message}"
//     });
//     return Ok();
// }

[HttpPost("{id}/log-emotion")]
public IActionResult LogEmotion(int id, [FromBody] EmotionLogDto request)
{
    var goal = _goalService.GetGoalById(id);
    if (goal == null) return NotFound();

    _logService.LogAction(new Log
    {
        UserId = goal.UserId,
        ActionType = "EmotionCheckin",
        Description = $"Feeling: {request.Emotion} during {request.Context}",
        Timestamp = DateTime.UtcNow
    });
    return Ok();
}[HttpGet("user/{userId}/history")]
public IActionResult GetGoalHistory(int userId)
{
    var goals = _goalService.GetGoalsByUser(userId);
    var logs = _logService.GetLogsForUser(userId);

    var history = new List<HistoryEntry>();

    // Add goal creation and completion entries
    foreach (var goal in goals)
    {
        history.Add(new HistoryEntry
        {
            Action = "Created",
            Description = $"Created goal: \"{goal.Title}\" in {goal.Category} ({goal.Difficulty})",
            Timestamp = goal.CreatedAt
        });

        if (goal.Completed == 1)
        {
            history.Add(new HistoryEntry
            {
                Action = "Completed",
                Description = $"Completed goal: \"{goal.Title}\"",
                Timestamp = goal.UpdatedAt ?? DateTime.UtcNow
            });
        }
    }

    // Add logs
    foreach (var log in logs)
    {
        history.Add(new HistoryEntry
        {
            Action = log.ActionType,
            Description = log.Description ?? "",
            Timestamp = log.Timestamp
        });
    }

    // ✅ Now safe to sort
    var sorted = history.OrderByDescending(h => h.Timestamp).ToList();

    return Ok(sorted);
}

[HttpPost("update-suggestions/{userId}")]
public IActionResult UpdateSuggestions(int userId)
{
    try
    {
        var userGoals = _goalService.GetGoalsByUser(userId);
        var completedGoals = userGoals.Where(g => g.Completed == 1).ToList();
        var activeGoals = userGoals.Where(g => g.Completed == 0).ToList();
        
        // Generate new suggestions based on progress and performance
        var newSuggestions = GenerateProgressBasedSuggestions(userId, completedGoals, activeGoals);
        
        // Update user's suggested goals in pretest service
        _pretestService.SavePretestAnswers(userId, new Dictionary<string, string>(), newSuggestions);
        
        return Ok(new { UpdatedSuggestions = newSuggestions });
    }
    catch (Exception ex)
    {
        return BadRequest($"Failed to update suggestions: {ex.Message}");
    }
}

[HttpGet("performance-stats/{userId}")]
public IActionResult GetPerformanceStats(int userId)
{
    try
    {
        var userGoals = _goalService.GetGoalsByUser(userId);
        var completedGoals = userGoals.Where(g => g.Completed == 1).ToList();
        var stats = GetUserPerformanceStats(userId, completedGoals);
        
        return Ok(new { 
            UserId = userId,
            Stats = stats
        });
    }
    catch (Exception ex)
    {
        return BadRequest($"Failed to get performance stats: {ex.Message}");
    }
}

[HttpPost("recommendation-reasons/{userId}")]
public IActionResult GetRecommendationReasons(int userId, [FromBody] List<string> recommendedGoals)
{
    try
    {
        Console.WriteLine($"💡 [REASONS API] Called for userId: {userId}");
        Console.WriteLine($"💡 [REASONS API] Received {recommendedGoals?.Count ?? 0} goals");
        
        if (recommendedGoals != null)
        {
            foreach (var goal in recommendedGoals)
            {
                Console.WriteLine($"💡 [REASONS API] Goal: {goal}");
            }
        }
        
        var userGoals = _goalService.GetGoalsByUser(userId);
        var completedGoals = userGoals.Where(g => g.Completed == 1).ToList();
        var stats = GetUserPerformanceStats(userId, completedGoals);
        
        Console.WriteLine($"💡 [REASONS API] Stats: {stats}");
        
        var reasons = new Dictionary<string, string>();
        
        foreach (var goalSuggestion in recommendedGoals)
        {
            // Parse "Category|Title|Difficulty" format
            var parts = goalSuggestion.Split('|');
            Console.WriteLine($"💡 [REASONS API] Parsed parts: {string.Join(" | ", parts)} (count: {parts.Length})");
            
            if (parts.Length >= 2)
            {
                var category = parts[0];
                var title = parts[1];
                Console.WriteLine($"💡 [REASONS API] Generating reason for: Category='{category}', Title='{title}'");
                var reason = GenerateRecommendationReason(title, category, stats, completedGoals);
                Console.WriteLine($"💡 [REASONS API] Generated reason length: {reason.Length} chars");
                reasons[title] = reason;
            }
        }
        
        Console.WriteLine($"💡 [REASONS API] Returning {reasons.Count} reasons");
        return Ok(new { Reasons = reasons });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"❌ [REASONS API] Error: {ex.Message}");
        Console.WriteLine($"❌ [REASONS API] Stack: {ex.StackTrace}");
        return BadRequest($"Failed to get recommendation reasons: {ex.Message}");
    }
}

// GetRecommendationInsights method removed - no longer used (replaced by GenerateRecommendationReason)

private List<string> GenerateProgressBasedSuggestions(int userId, List<Goal> completedGoals, List<Goal> activeGoals)
{
    var suggestions = new List<string>();
    
    // Get performance statistics for adaptive recommendations
    var performanceStats = GetUserPerformanceStats(userId, completedGoals);
    
    // Check if user is expert level from pretest
    bool isExpertLevel = IsUserExpertLevel(userId);
    
    Console.WriteLine($"[RECOMMENDATIONS] User {userId} - Performance Stats: {performanceStats}, IsExpert: {isExpertLevel}");
    
    // Define the goal progression mapping - matching frontend categorizedGoals structure from GoalForm
    var categorizedGoals = new Dictionary<string, List<(string title, string difficulty, int level)>>
    {
        ["Basic Understanding"] = new List<(string, string, int)>
        {
            ("Learn what linear equations are", "very easy", 1),
            ("Understand how substitution works", "very easy", 2),
            ("Understand how elimination works", "very easy", 2),
            ("Understand how equalization works", "very easy", 2)
        },
        ["Method Mastery"] = new List<(string, string, int)>
        {
            ("Master substitution/equalization/elimination method", "easy", 1),
            ("Practice with different methods", "easy", 2),
            ("Switch methods strategically", "medium", 3),
            ("Choose optimal methods consistently", "hard", 4),
            ("Master all three methods fluently", "very hard", 5)
        },
        ["Problem Solving"] = new List<(string, string, int)>
        {
            ("Complete exercises without hints", "easy", 1),
            ("Solve problems with minimal errors", "medium", 2),
            ("Handle complex problems confidently", "medium", 3),
            ("Show exceptional problem-solving", "hard", 4),
            ("Maintain accuracy under pressure", "very hard", 5)
        },
        ["Learning & Growth"] = new List<(string, string, int)>
        {
            ("Reflect on method effectiveness", "very easy", 1),
            ("Build confidence through success", "easy", 2),
            ("Learn from mistakes effectively", "easy", 2),
            ("Track progress meaningfully", "medium", 3),
            ("Develop problem-solving resilience", "medium", 3),
            ("Explain reasoning clearly", "medium", 3),
            ("Show consistent improvement", "hard", 4),
            ("Set personal learning challenges", "hard", 4),
            ("Work independently", "very hard", 5)
        }
    };
    
    // ADAPTIVE RECOMMENDATION LOGIC based on performance
    suggestions = GenerateAdaptiveSuggestions(categorizedGoals, completedGoals, activeGoals, performanceStats, isExpertLevel);
    
    // If no specific progression suggestions, provide variety based on performance
    if (suggestions.Count == 0)
    {
        suggestions = GetDefaultSuggestions(performanceStats, isExpertLevel);
    }
    
    // Limit to 3-4 suggestions to avoid overwhelming
    return suggestions.Take(4).ToList();
}

private bool IsUserExpertLevel(int userId)
{
    try
    {
        var pretestAnswers = _pretestService.GetUserPretestAnswers(userId);
        
        // Check q1 (confidence level)
        if (pretestAnswers.ContainsKey("q1"))
        {
            var confidence = pretestAnswers["q1"];
            // Exclude Basic Understanding for "Very confident" and "Expert level" users
            // Only "Not confident" and "Somewhat confident" users get Basic Understanding goals
            if (confidence.Contains("Very confident") || 
                (!confidence.Contains("Not confident") && !confidence.Contains("Somewhat confident")))
            {
                return true; // Very confident or Expert level
            }
        }
        
        return false;
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[DEBUG] Error checking expert level: {ex.Message}");
        return false;
    }
}

private List<string> GenerateAdaptiveSuggestions(
    Dictionary<string, List<(string title, string difficulty, int level)>> categorizedGoals,
    List<Goal> completedGoals,
    List<Goal> activeGoals,
    PerformanceStats stats,
    bool isExpertLevel = false)
{
    var suggestions = new List<string>();
    
    // Analyze each category for adaptive recommendations
    foreach (var category in categorizedGoals.Keys)
    {
        // Skip Basic Understanding for expert users
        if (isExpertLevel && category == "Basic Understanding")
        {
            continue;
        }
        
        var categoryCompleted = completedGoals.Where(g => g.Category == category).ToList();
        var categoryActive = activeGoals.Where(g => g.Category == category).ToList();
        
        if (categoryActive.Any())
        {
            continue; // Skip if user has active goals in this category
        }
        
        var suggestion = GetCategoryRecommendation(category, categorizedGoals[category], categoryCompleted, stats);
        if (!string.IsNullOrEmpty(suggestion))
        {
            suggestions.Add(suggestion);
        }
    }
    
    return suggestions;
}

private string GetCategoryRecommendation(
    string category,
    List<(string title, string difficulty, int level)> categoryGoals,
    List<Goal> categoryCompleted,
    PerformanceStats stats)
{
    // Find the highest level completed in this category
    var maxCompletedLevel = GetMaxCompletedLevel(categoryGoals, categoryCompleted);
    
    // Filter out already completed goals to get available goals
    var completedTitles = categoryCompleted.Select(g => g.Title).ToHashSet();
    var availableGoals = categoryGoals.Where(g => !completedTitles.Contains(g.title)).ToList();
    
    // Adaptive logic based on performance and category
    switch (category)
    {
        case "Basic Understanding":
            return GetUnderstandingRecommendation(availableGoals, maxCompletedLevel, stats);
        case "Method Mastery":
            return GetStrategyRecommendation(availableGoals, maxCompletedLevel, stats);
        case "Problem Solving":
            return GetProblemSolvingRecommendation(availableGoals, maxCompletedLevel, stats);
        case "Learning & Growth":
            return GetReflectionRecommendation(availableGoals, maxCompletedLevel, stats);
        default:
            // Default progression
            var nextGoal = categoryGoals.FirstOrDefault(g => g.level == maxCompletedLevel + 1);
            return nextGoal != default ? $"{category}|{nextGoal.title}|{nextGoal.difficulty}" : "";
    }
}

private string GetStrategyRecommendation(List<(string title, string difficulty, int level)> goals, int maxLevel, PerformanceStats stats)
{
    // For new users, start with basic progression
    if (stats.TotalGoalsCompleted == 0 || stats.AverageHintsPerGoal == -1)
    {
        var firstGoal = goals.FirstOrDefault(g => g.level == 1);
        return firstGoal != default ? $"Method Mastery|{firstGoal.title}|{firstGoal.difficulty}" : "";
    }
    
    // Check performance conditions
    bool hasHighHints = stats.AverageHintsPerGoal > 3 && stats.AverageHintsPerGoal > 0;
    
    // If student uses hints frequently, suggest method practice
    if (hasHighHints)
    {
        var practiceGoal = goals.FirstOrDefault(g => g.title.Contains("Practice") || g.title.Contains("method"));
        if (practiceGoal != default)
            return $"Method Mastery|{practiceGoal.title}|{practiceGoal.difficulty}";
    }
    
    // Normal progression
    var nextGoal = goals.FirstOrDefault(g => g.level == maxLevel + 1);
    return nextGoal != default ? $"Method Mastery|{nextGoal.title}|{nextGoal.difficulty}" : "";
}

private string GetUnderstandingRecommendation(List<(string title, string difficulty, int level)> goals, int maxLevel, PerformanceStats stats)
{
    // For new users, start with level 1 basics
    if (stats.TotalGoalsCompleted == 0 || stats.AverageActualScore == -1)
    {
        var firstGoal = goals.FirstOrDefault(g => g.level == 1);
        return firstGoal != default ? $"Basic Understanding|{firstGoal.title}|{firstGoal.difficulty}" : "";
    }
    
    // Check performance conditions - ActualScore stores error count
    bool hasHighErrors = stats.AverageActualScore >= 3;
    
    // If student has many errors, recommend any available basic goal (prefer lower levels)
    if (hasHighErrors)
    {
        // Try to find next level goal first
        var nextGoal = goals.FirstOrDefault(g => g.level == maxLevel + 1);
        if (nextGoal != default)
            return $"Basic Understanding|{nextGoal.title}|{nextGoal.difficulty}";
        
        // If no next level, recommend any available goal to reinforce basics
        var anyGoal = goals.FirstOrDefault();
        return anyGoal != default ? $"Basic Understanding|{anyGoal.title}|{anyGoal.difficulty}" : "";
    }
    
    // Progress normally if doing well
    var nextGoal2 = goals.FirstOrDefault(g => g.level == maxLevel + 1);
    return nextGoal2 != default ? $"Basic Understanding|{nextGoal2.title}|{nextGoal2.difficulty}" : "";
}

private string GetReflectionRecommendation(List<(string title, string difficulty, int level)> goals, int maxLevel, PerformanceStats stats)
{
    // For new users, start with level 1 reflection goals
    if (stats.TotalGoalsCompleted == 0 || stats.AverageSatisfaction == -1)
    {
        var firstGoal = goals.FirstOrDefault(g => g.level == 1);
        return firstGoal != default ? $"Learning & Growth|{firstGoal.title}|{firstGoal.difficulty}" : "";
    }
    
    // Check all performance conditions - ActualScore stores error count
    bool hasLowSatisfaction = stats.AverageSatisfaction < 3 && stats.AverageSatisfaction > 0;
    bool hasLowEffort = stats.AverageEffort < 3 && stats.AverageEffort > 0;
    bool hasHighErrors = stats.AverageActualScore >= 3;
    
    // Priority-based conflict resolution: Low satisfaction > High errors
    // If multiple issues, prioritize emotional/motivational support first
    if (hasLowSatisfaction || hasLowEffort)
    {
        var reflectionGoal = goals.FirstOrDefault(g => g.title.Contains("Reflect") || g.title.Contains("Build confidence") || g.title.Contains("resilience"));
        if (reflectionGoal != default)
            return $"Learning & Growth|{reflectionGoal.title}|{reflectionGoal.difficulty}";
    }
    
    if (hasHighErrors)
    {
        var trackingGoal = goals.FirstOrDefault(g => g.title.Contains("Track progress") || g.title.Contains("Learn from mistakes"));
        if (trackingGoal != default)
            return $"Learning & Growth|{trackingGoal.title}|{trackingGoal.difficulty}";
    }
    
    // Normal progression
    var nextGoal = goals.FirstOrDefault(g => g.level == maxLevel + 1);
    return nextGoal != default ? $"Learning & Growth|{nextGoal.title}|{nextGoal.difficulty}" : "";
}

private string GetProblemSolvingRecommendation(List<(string title, string difficulty, int level)> goals, int maxLevel, PerformanceStats stats)
{
    // For new users, start with level 1 problem-solving goals
    if (stats.TotalGoalsCompleted == 0 || stats.AverageActualScore == -1)
    {
        var firstGoal = goals.FirstOrDefault(g => g.level == 1);
        return firstGoal != default ? $"Problem Solving|{firstGoal.title}|{firstGoal.difficulty}" : "";
    }
    
    // Check all performance conditions - use same thresholds as GetDefaultSuggestions
    bool hasHighErrors = stats.AverageActualScore >= 3; // ActualScore stores error count
    bool hasHighHints = stats.AverageHintsPerGoal > 3 && stats.AverageHintsPerGoal > 0;
    
    // Priority-based conflict resolution: Errors > Hints
    // If both conditions true, prioritize fixing errors first (more critical)
    if (hasHighErrors)
    {
        var accuracyGoal = goals.FirstOrDefault(g => g.title.Contains("minimal errors") || g.title.Contains("accuracy"));
        if (accuracyGoal != default)
            return $"Problem Solving|{accuracyGoal.title}|{accuracyGoal.difficulty}";
    }
    
    if (hasHighHints)
    {
        var independenceGoal = goals.FirstOrDefault(g => g.title.Contains("without hints") || g.title.Contains("independently"));
        if (independenceGoal != default)
            return $"Problem Solving|{independenceGoal.title}|{independenceGoal.difficulty}";
    }
    
    // Normal progression
    var nextGoal = goals.FirstOrDefault(g => g.level == maxLevel + 1);
    return nextGoal != default ? $"Problem Solving|{nextGoal.title}|{nextGoal.difficulty}" : "";
}

private List<string> GetDefaultSuggestions(PerformanceStats stats, bool isExpertLevel = false)
{
    var suggestions = new List<string>();
    
    // For new users, provide beginner-friendly suggestions
    if (stats.TotalGoalsCompleted == 0)
    {
        // Expert users should not get basic understanding goals
        if (!isExpertLevel)
        {
            suggestions.Add("Basic Understanding|Learn what linear equations are|very easy");
        }
        suggestions.Add("Learning & Growth|Reflect on method effectiveness|very easy");
        suggestions.Add("Learning & Growth|Build confidence through success|easy");
        return suggestions;
    }
    
    // Adaptive default suggestions based on performance with conflict resolution
    bool hasHighErrors = stats.AverageActualScore >= 3; // ActualScore stores error count - same threshold as category methods
    bool hasModerateErrors = stats.AverageActualScore >= 2 && stats.AverageActualScore < 3;
    bool hasHighHints = stats.AverageHintsPerGoal > 3 && stats.AverageHintsPerGoal > 0;
    bool hasModerateHints = stats.AverageHintsPerGoal > 2 && stats.AverageHintsPerGoal <= 3 && stats.AverageHintsPerGoal > 0;
    bool hasLowSatisfaction = stats.AverageSatisfaction < 3 && stats.AverageSatisfaction > 0;
    
    // Priority-based suggestions for conflicting performance issues
    if (hasHighErrors && hasHighHints)
    {
        // Multiple severe issues: focus on fundamentals first (but skip basics for experts)
        if (!isExpertLevel)
        {
            suggestions.Add("Basic Understanding|Learn what linear equations are|very easy");
        }
        suggestions.Add("Learning & Growth|Build confidence through success|easy");
        if (!isExpertLevel)
        {
            suggestions.Add("Basic Understanding|Understand how substitution works|easy");
        }
        else
        {
            suggestions.Add("Method Mastery|Practice with different methods|easy");
        }
    }
    else if (hasHighErrors && hasLowSatisfaction)
    {
        // High errors + low satisfaction: make learning enjoyable while fixing accuracy
        suggestions.Add("Learning & Growth|Build confidence through success|easy");
        if (!isExpertLevel)
        {
            suggestions.Add("Basic Understanding|Learn what linear equations are|very easy");
        }
        else
        {
            suggestions.Add("Method Mastery|Practice with different methods|easy");
        }
        suggestions.Add("Learning & Growth|Reflect on method effectiveness|very easy");
    }
    else if (hasHighHints && hasLowSatisfaction)
    {
        // High hints + low satisfaction: build confidence then independence
        suggestions.Add("Learning & Growth|Build confidence through success|easy");
        suggestions.Add("Method Mastery|Practice with different methods|easy");
        suggestions.Add("Learning & Growth|Track progress meaningfully|medium");
    }
    else if (hasHighErrors)
    {
        // High errors: focus on accuracy and fundamentals (but skip basics for experts)
        if (!isExpertLevel)
        {
            suggestions.Add("Basic Understanding|Learn what linear equations are|very easy");
        }
        else
        {
            suggestions.Add("Method Mastery|Practice with different methods|easy");
        }
        suggestions.Add("Problem Solving|Solve problems with minimal errors|medium");
        suggestions.Add("Learning & Growth|Build confidence through success|easy");
    }
    else if (hasModerateErrors && hasModerateHints)
    {
        // Moderate issues: balanced approach
        suggestions.Add("Method Mastery|Practice with different methods|easy");
        suggestions.Add("Problem Solving|Solve problems with minimal errors|medium");
        suggestions.Add("Learning & Growth|Build confidence through success|easy");
    }
    else if (hasHighHints || hasModerateHints)
    {
        // Hint dependency: focus on independence
        suggestions.Add("Method Mastery|Practice with different methods|easy");
        suggestions.Add("Problem Solving|Complete exercises without hints|easy");
        suggestions.Add("Learning & Growth|Track progress meaningfully|medium");
    }
    else if (hasLowSatisfaction)
    {
        // Low satisfaction: focus on enjoyment
        suggestions.Add("Learning & Growth|Build confidence through success|easy");
        suggestions.Add("Learning & Growth|Develop problem-solving resilience|medium");
        if (!isExpertLevel)
        {
            suggestions.Add("Basic Understanding|Understand how substitution works|easy");
        }
        else
        {
            suggestions.Add("Method Mastery|Switch methods strategically|medium");
        }
    }
    else
    {
        // Good performance: provide variety and challenge
        if (!isExpertLevel)
        {
            suggestions.Add("Basic Understanding|Learn what linear equations are|very easy");
        }
        suggestions.Add("Method Mastery|Practice with different methods|easy");
        suggestions.Add("Learning & Growth|Reflect on method effectiveness|very easy");
        suggestions.Add("Learning & Growth|Set personal learning challenges|hard");
    }
    
    return suggestions;
}

private int GetMaxCompletedLevel(List<(string title, string difficulty, int level)> categoryGoals, List<Goal> categoryCompleted)
{
    var maxCompletedLevel = 0;
    foreach (var completed in categoryCompleted)
    {
        var matchingGoal = categoryGoals.FirstOrDefault(g => 
            g.title.Contains(completed.Title.Split(' ').Take(3).FirstOrDefault() ?? "") ||
            completed.Title.Contains(g.title.Split(' ').Take(3).FirstOrDefault() ?? ""));
        
        if (matchingGoal != default)
        {
            maxCompletedLevel = Math.Max(maxCompletedLevel, matchingGoal.level);
        }
    }
    return maxCompletedLevel;
}

// Performance statistics calculation
private PerformanceStats GetUserPerformanceStats(int userId, List<Goal> completedGoals)
{
    var stats = new PerformanceStats();
    
    if (!completedGoals.Any())
    {
        // For new users, set clear "no data" indicators
        stats.TotalGoalsCompleted = 0;
        stats.AverageActualScore = -1; // -1 indicates no data
        stats.AverageConfidence = -1;
        stats.AverageSatisfaction = -1;
        stats.AverageEffort = -1;
        stats.AverageHintsPerGoal = -1;
        stats.AverageErrorsPerGoal = -1;
        
        Console.WriteLine($"[STATS] New User {userId}: No completed goals, returning empty stats");
        return stats; // Return clear "no data" stats for new users
    }
    
    // Calculate performance metrics from completed goals
    var goalsWithScores = completedGoals.Where(g => g.ActualScore.HasValue).ToList();
    var goalsWithConfidence = completedGoals.Where(g => g.PostConfidence.HasValue).ToList();
    var goalsWithSatisfaction = completedGoals.Where(g => g.PostSatisfaction.HasValue).ToList();
    var goalsWithEffort = completedGoals.Where(g => g.PostEffort.HasValue).ToList();
    
    stats.TotalGoalsCompleted = completedGoals.Count;
    stats.AverageActualScore = goalsWithScores.Any() ? goalsWithScores.Average(g => g.ActualScore!.Value) : 0.5;
    stats.AverageConfidence = goalsWithConfidence.Any() ? goalsWithConfidence.Average(g => g.PostConfidence!.Value) : 3.0;
    stats.AverageSatisfaction = goalsWithSatisfaction.Any() ? goalsWithSatisfaction.Average(g => g.PostSatisfaction!.Value) : 3.0;
    stats.AverageEffort = goalsWithEffort.Any() ? goalsWithEffort.Average(g => g.PostEffort!.Value) : 3.0;
    
    // Calculate actual hints and errors from stored data
    var goalsWithHints = completedGoals.Where(g => g.HintsUsed.HasValue).ToList();
    var goalsWithErrors = completedGoals.Where(g => g.ErrorsMade.HasValue).ToList();
    
    stats.AverageHintsPerGoal = goalsWithHints.Any() ? goalsWithHints.Average(g => g.HintsUsed!.Value) : -1;
    stats.AverageErrorsPerGoal = goalsWithErrors.Any() ? goalsWithErrors.Average(g => g.ErrorsMade!.Value) : -1;
    
    Console.WriteLine($"[STATS] User {userId}: Goals={stats.TotalGoalsCompleted}, Score={stats.AverageActualScore:F2}, Conf={stats.AverageConfidence:F1}, Hints={stats.AverageHintsPerGoal:F1}, Errors={stats.AverageErrorsPerGoal:F1}");
    
    return stats;
}

// Performance statistics model
public class PerformanceStats
{
    public int TotalGoalsCompleted { get; set; } = 0;
    public double AverageActualScore { get; set; } = 0.5;
    public double AverageConfidence { get; set; } = 3.0;
    public double AverageSatisfaction { get; set; } = 3.0;
    public double AverageEffort { get; set; } = 3.0;
    public double AverageHintsPerGoal { get; set; } = 2.0;
    public double AverageErrorsPerGoal { get; set; } = 3.0;
    
    public override string ToString()
    {
        return $"Goals:{TotalGoalsCompleted}, Score:{AverageActualScore:F2}, Conf:{AverageConfidence:F1}, Hints:{AverageHintsPerGoal:F1}, Errors:{AverageErrorsPerGoal:F1}";
    }
}

[HttpPost("log")]
public IActionResult LogAction([FromBody] LogActionRequest request)
{
    _logService.LogAction(new Log {
        UserId = request.UserId,
        ActionType = request.ActionType,
        Description = request.Description
    });
    return Ok();
}

        [HttpPost("study/login")]
        public IActionResult StudyLogin([FromBody] StudyLoginRequest request)
        {
            // Simple validation - no new tables needed
            if (string.IsNullOrEmpty(request.ParticipantId))
                return BadRequest("Participant ID required");
            
            // Generate userId from participant ID (deterministic)
            var userId = GenerateUserIdFromParticipantId(request.ParticipantId);
            
            return Ok(new { UserId = userId, ParticipantId = request.ParticipantId });
        }

        private int GenerateUserIdFromParticipantId(string participantId)
        {
            // Simple hash-based generation - always same ID for same participant
            var hash = participantId.GetHashCode();
            return Math.Abs(hash) % 900000 + 100000; // Range: 100000-999999
        }

        private string GenerateRecommendationReason(string goalTitle, string category, PerformanceStats stats, List<Goal> completedGoals)
        {
            // Performance indicators - using same thresholds as recommendation logic
            bool hasHighErrors = stats.AverageActualScore >= 3; // ActualScore stores error count
            bool hasHighHints = stats.AverageHintsPerGoal > 3 && stats.AverageHintsPerGoal >= 0;
            bool hasModerateHints = stats.AverageHintsPerGoal > 2 && stats.AverageHintsPerGoal <= 3 && stats.AverageHintsPerGoal >= 0;
            bool hasLowConfidence = stats.AverageConfidence < 3 && stats.AverageConfidence > 0;
            bool hasLowSatisfaction = stats.AverageSatisfaction < 3 && stats.AverageSatisfaction > 0;
            bool isNewUser = stats.TotalGoalsCompleted == 0;
            
            // Build contextual reason based on actual performance data
            var reason = new System.Text.StringBuilder();
            
            // Header with goal category and current performance
            reason.AppendLine("Why This Goal Is Recommended**\n");
            reason.AppendLine($"Category: {category}");
            reason.AppendLine($"Your Progress: {stats.TotalGoalsCompleted} goals completed\n");
            
            // Performance summary
            if (!isNewUser)
            {
                reason.AppendLine("📊 Your Current Performance:");
                if (stats.AverageActualScore >= 0)
                    reason.AppendLine($"• Average Errors: {stats.AverageActualScore:F1} per goal");
                if (stats.AverageHintsPerGoal >= 0)
                    reason.AppendLine($"• Average Hints Used: {stats.AverageHintsPerGoal:F1} per goal");
                if (stats.AverageConfidence > 0)
                    reason.AppendLine($"• Average Confidence: {stats.AverageConfidence:F1}/5");
                reason.AppendLine();
            }
            
            // Specific reasoning based on goal and performance patterns
            reason.AppendLine("💡 Why We Recommend This Now:");
            
            switch (category)
            {
                case "Basic Understanding":
                    if (isNewUser)
                    {
                        reason.AppendLine($"• You're just starting your learning journey");
                        reason.AppendLine($"• \"{goalTitle}\" provides essential foundational knowledge");
                        reason.AppendLine($"• Understanding these basics is crucial for all advanced topics");
                    }
                    else if (hasHighErrors)
                    {
                        reason.AppendLine($"• Your error rate ({stats.AverageActualScore:F1} per goal) suggests gaps in fundamentals");
                        reason.AppendLine($"• Strengthening basic understanding will reduce future errors");
                        reason.AppendLine($"• This goal addresses the root cause of accuracy issues");
                    }
                    else
                    {
                        reason.AppendLine($"• Natural progression from your {stats.TotalGoalsCompleted} completed goals");
                        reason.AppendLine($"• Builds on what you've already learned");
                        reason.AppendLine($"• Prepares you for more advanced method mastery");
                    }
                    break;
                    
                case "Method Mastery":
                    if (hasHighHints || hasModerateHints)
                    {
                        reason.AppendLine($"• You're using {stats.AverageHintsPerGoal:F1} hints per goal on average");
                        reason.AppendLine($"• Mastering methods will reduce your dependence on hints");
                        reason.AppendLine($"• This builds the skills needed for independent problem-solving");
                    }
                    else if (isNewUser)
                    {
                        reason.AppendLine($"• Method mastery is key to solving linear equations efficiently");
                        reason.AppendLine($"• Learning different methods gives you strategic flexibility");
                        reason.AppendLine($"• This is a core skill for all equation-solving tasks");
                    }
                    else
                    {
                        reason.AppendLine($"• You've mastered the basics - ready for strategic method use");
                        reason.AppendLine($"• This goal develops your problem-solving toolkit");
                        reason.AppendLine($"• Knowing multiple methods makes you more adaptable");
                    }
                    break;
                    
                case "Problem Solving":
                    if (goalTitle.Contains("without hints") && hasHighHints)
                    {
                        reason.AppendLine($"• You currently use {stats.AverageHintsPerGoal:F1} hints per goal");
                        reason.AppendLine($"• Working without hints builds true independence");
                        reason.AppendLine($"• This challenge will strengthen your problem-solving confidence");
                    }
                    else if (goalTitle.Contains("minimal errors") && hasHighErrors)
                    {
                        reason.AppendLine($"• Your current error rate is {stats.AverageActualScore:F1} per goal");
                        reason.AppendLine($"• Focusing on accuracy improves long-term performance");
                        reason.AppendLine($"• Careful problem-solving prevents frustration and builds mastery");
                    }
                    else
                    {
                        reason.AppendLine($"• You've built solid foundational skills");
                        reason.AppendLine($"• This goal challenges you to apply what you've learned");
                        reason.AppendLine($"• Problem-solving goals develop real-world competence");
                    }
                    break;
                    
                case "Learning & Growth":
                    if (goalTitle.Contains("confidence") && hasLowConfidence)
                    {
                        reason.AppendLine($"• Your confidence level is {stats.AverageConfidence:F1}/5");
                        reason.AppendLine($"• Building confidence through success improves motivation");
                        reason.AppendLine($"• Higher confidence leads to better problem-solving performance");
                    }
                    else if (goalTitle.Contains("mistakes") && hasHighErrors)
                    {
                        reason.AppendLine($"• You're making {stats.AverageActualScore:F1} errors per goal");
                        reason.AppendLine($"• Learning from mistakes turns errors into growth opportunities");
                        reason.AppendLine($"• Metacognitive skills help you improve faster");
                    }
                    else
                    {
                        reason.AppendLine($"• Metacognitive goals enhance overall learning effectiveness");
                        reason.AppendLine($"• Self-awareness and reflection accelerate skill development");
                        reason.AppendLine($"• These skills apply beyond just equation solving");
                    }
                    break;
            }
            
            // Strategic benefit
            reason.AppendLine($"\n✨ Strategic Benefit:");
            if (hasHighErrors && hasHighHints)
            {
                reason.AppendLine("• Addresses multiple performance issues simultaneously");
                reason.AppendLine("• Targeting fundamentals first prevents compound problems");
            }
            else if (hasHighErrors)
            {
                reason.AppendLine("• Directly addresses your highest-priority improvement area");
                reason.AppendLine("• Reducing errors unlocks access to more advanced goals");
            }
            else if (hasHighHints)
            {
                reason.AppendLine("• Builds independence which accelerates all future learning");
                reason.AppendLine("• Less reliance on hints = deeper understanding");
            }
            else if (isNewUser)
            {
                reason.AppendLine("• Perfect starting point for your learning journey");
                reason.AppendLine("• Sets you up for success in more advanced topics");
            }
            else
            {
                reason.AppendLine("• Natural next step in your learning progression");
                reason.AppendLine("• Maintains momentum while building new skills");
            }
            
            return reason.ToString();
        }

    }

public class LogActionRequest
{
    public int UserId { get; set; }
    public string ActionType { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
}

public class StudyLoginRequest
{
    public string ParticipantId { get; set; } = string.Empty;
}


}


