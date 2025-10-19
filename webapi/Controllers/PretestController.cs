using Microsoft.AspNetCore.Mvc;
using webapi.Services;
using webapi.Dtos;

namespace webapi.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PretestController : ControllerBase
    {
        private readonly ILogger<PretestController> _logger;
        private readonly IPretestService _pretestService;

        public PretestController(ILogger<PretestController> logger, IPretestService pretestService)
        {
            _logger = logger;
            _pretestService = pretestService;
        }

        [HttpPost("save")]
        public ActionResult SavePretestAnswers([FromBody] PretestSubmissionDto request)
        {
            try
            {
                if (request == null || request.Answers == null)
                {
                    _logger.LogWarning("Invalid pretest request received");
                    return BadRequest("Invalid request");
                }

                _logger.LogInformation("Processing pretest for user {UserId} with {AnswerCount} answers", 
                    request.UserId, request.Answers.Count);

                // Check if user already completed pretest
                if (_pretestService.HasUserCompletedPretest(request.UserId))
                {
                    _logger.LogInformation("User {UserId} already completed pretest, returning existing suggestions", request.UserId);
                    var existingSuggestions = _pretestService.GetUserSuggestedGoals(request.UserId);
                    return Ok(new PretestResultDto
                    {
                        Success = true,
                        SuggestedGoals = existingSuggestions,
                        Message = "You have already completed the assessment!"
                    });
                }

                // Generate progressive suggestions with proper formatting: Category|Title|Difficulty
                var goals = new List<string>();
                
                // Log all answers for debugging
                foreach (var answer in request.Answers)
                {
                    _logger.LogInformation("Answer {Key}: {Value}", answer.Key, answer.Value);
                }
                
                // Check math confidence (q1) - Progressive difficulty approach
                if (request.Answers.ContainsKey("q1"))
                {
                    var confidence = request.Answers["q1"];
                    _logger.LogInformation("Processing confidence level: {Confidence}", confidence);
                    
                    if (confidence.Contains("Not confident"))
                    {
                        // Start with Basic Understanding (very easy), then build confidence
                        goals.Add("Basic Understanding|Learn what linear equations are|very easy");
                        goals.Add("Learning & Growth|Build confidence through success|easy");
                    }
                    else if (confidence.Contains("Somewhat confident"))
                    {
                        // Start with easy Understanding, then practice
                        goals.Add("Basic Understanding|Understand how substitution works|very easy");
                        goals.Add("Method Mastery|Practice with different methods|easy");
                    }
                    else if (confidence.Contains("Very confident"))
                    {
                        // Can start with medium level, focus on analysis
                        goals.Add("Method Mastery|Switch methods strategically|medium");
                        goals.Add("Learning & Growth|Explain reasoning clearly|medium");
                    }
                    else // Expert level
                    {
                        // Can start with hard level and evaluation
                        goals.Add("Method Mastery|Choose optimal methods consistently|hard");
                        goals.Add("Learning & Growth|Set personal learning challenges|hard");
                    }
                }

                // Check goal preference (q2) - Add complementary goals
                if (request.Answers.ContainsKey("q2"))
                {
                    var goalType = request.Answers["q2"];
                    var confidence = request.Answers.ContainsKey("q1") ? request.Answers["q1"] : "";
                    
                    if (goalType.Contains("Quick practice"))
                    {
                        // Add confidence building for quick sessions
                        if (confidence.Contains("Not confident"))
                            goals.Add("Learning & Growth|Reflect on method effectiveness|very easy");
                        else
                            goals.Add("Learning & Growth|Build confidence through success|easy");
                    }
                    else if (goalType.Contains("Deep understanding"))
                    {
                        // Add reflection goals for deep learning
                        if (confidence.Contains("Not confident") || confidence.Contains("Somewhat confident"))
                            goals.Add("Basic Understanding|Understand how substitution works|very easy");
                        else
                            goals.Add("Learning & Growth|Develop problem-solving resilience|medium");
                    }
                    else if (goalType.Contains("Problem variety"))
                    {
                        // Add varied method practice
                        if (confidence.Contains("Very confident") || confidence.Contains("Expert"))
                            goals.Add("Method Mastery|Choose optimal methods consistently|hard");
                        else
                            goals.Add("Method Mastery|Practice with different methods|easy");
                    }
                    else if (goalType.Contains("Skill building"))
                    {
                        // Add progressive skill goals
                        if (confidence.Contains("Not confident"))
                            goals.Add("Problem Solving|Complete exercises without hints|easy");
                        else
                            goals.Add("Method Mastery|Master all three methods fluently|very hard");
                    }
                }

                // Limit to 2-3 goals max and remove duplicates
                goals = goals.Distinct().Take(3).ToList();

                // Ensure we always have at least 2 goals suggested
                if (goals.Count == 0)
                {
                    _logger.LogWarning("No goals were generated, adding default suggestions");
                    goals.Add("Basic Understanding|Learn what linear equations are|very easy");
                    goals.Add("Learning & Growth|Build confidence through success|easy");
                }
                else if (goals.Count == 1)
                {
                    // Add a complementary goal if we only have one
                    var confidence = request.Answers.ContainsKey("q1") ? request.Answers["q1"] : "";
                    if (confidence.Contains("Not confident"))
                        goals.Add("Learning & Growth|Reflect on method effectiveness|very easy");
                    else
                        goals.Add("Learning & Growth|Explain reasoning clearly|medium");
                }

                _logger.LogInformation("Generated {GoalCount} goals for user {UserId}: {Goals}", 
                    goals.Count, request.UserId, string.Join(", ", goals));

                // Save to database
                _pretestService.SavePretestAnswers(request.UserId, request.Answers, goals);

                _logger.LogInformation("Successfully saved pretest results for user {UserId}", request.UserId);

                var result = new PretestResultDto
                {
                    Success = true,
                    SuggestedGoals = goals,
                    Message = "Assessment completed successfully!"
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing pretest submission for user {UserId}", request?.UserId);
                return StatusCode(500, "Error processing pretest");
            }
        }

        [HttpGet("status/{userId}")]
        public ActionResult GetPretestStatus(int userId)
        {
            try
            {
                _logger.LogInformation("Checking pretest status for user {UserId}", userId);
                
                var hasCompleted = _pretestService.HasUserCompletedPretest(userId);
                var suggestedGoals = _pretestService.GetUserSuggestedGoals(userId);

                _logger.LogInformation("User {UserId} completed status: {HasCompleted}, goals count: {GoalCount}", 
                    userId, hasCompleted, suggestedGoals?.Count ?? 0);

                var result = new PretestStatusDto
                {
                    HasCompleted = hasCompleted,
                    SuggestedGoals = suggestedGoals
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting pretest status for user {UserId}", userId);
                return StatusCode(500, "Error getting pretest status");
            }
        }
    }
}
