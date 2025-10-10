using Microsoft.AspNetCore.Mvc;
using webapi.Services;
using webapi.Dtos;
using System.Text.Json;

namespace webapi.Controllers
{
    [ApiController]
    [Route("api/custom-exercises")]
    public class CustomExerciseController : ControllerBase
    {
        private readonly ILogger<CustomExerciseController> _logger;
        private readonly ICustomExerciseService _customExerciseService;

        public CustomExerciseController(ILogger<CustomExerciseController> logger, ICustomExerciseService customExerciseService)
        {
            _logger = logger;
            _customExerciseService = customExerciseService;
        }

        [HttpPost("complete")]
        public ActionResult CompleteExercise([FromBody] ExerciseCompletionDto request)
        {
            try
            {
                if (request == null)
                {
                    _logger.LogWarning("Invalid exercise completion request received");
                    return BadRequest("Invalid request");
                }

                _logger.LogInformation("Processing exercise completion for user {UserId}, exercise {ExerciseId} ({ExerciseName})", 
                    request.UserId, request.ExerciseId, request.ExerciseName);

                _customExerciseService.SaveExerciseCompletion(
                    request.UserId, 
                    request.ExerciseId, 
                    request.ExerciseName, 
                    request.ExerciseType, 
                    request.CompletionData);

                _logger.LogInformation("Successfully saved exercise completion for user {UserId}, exercise {ExerciseId}", 
                    request.UserId, request.ExerciseId);

                var result = new ExerciseCompletionResultDto
                {
                    Success = true,
                    Message = "Exercise completion saved successfully!"
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing exercise completion for user {UserId}, exercise {ExerciseId}", 
                    request?.UserId, request?.ExerciseId);
                return StatusCode(500, "Error processing exercise completion");
            }
        }

        [HttpGet("status/{userId}/{exerciseId}")]
        public ActionResult<ExerciseStatusDto> GetExerciseStatus(int userId, int exerciseId)
        {
            try
            {
                _logger.LogInformation("Checking exercise status for user {UserId}, exercise {ExerciseId}", userId, exerciseId);

                var hasCompleted = _customExerciseService.HasUserCompletedExercise(userId, exerciseId);
                var exerciseData = _customExerciseService.GetExerciseCompletion(userId, exerciseId);

                Dictionary<string, object>? completionData = null;
                if (exerciseData?.CompletionData != null)
                {
                    try
                    {
                        completionData = JsonSerializer.Deserialize<Dictionary<string, object>>(exerciseData.CompletionData);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to deserialize completion data for user {UserId}, exercise {ExerciseId}", userId, exerciseId);
                    }
                }

                var result = new ExerciseStatusDto
                {
                    HasCompleted = hasCompleted,
                    CompletedAt = exerciseData?.CompletedAt,
                    CompletionData = completionData
                };

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting exercise status for user {UserId}, exercise {ExerciseId}", userId, exerciseId);
                return StatusCode(500, "Error getting exercise status");
            }
        }

        [HttpGet("user/{userId}")]
        public ActionResult GetUserExerciseData(int userId)
        {
            try
            {
                _logger.LogInformation("Getting all exercise data for user {UserId}", userId);

                var exercises = _customExerciseService.GetUserExerciseData(userId);

                return Ok(exercises);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user exercise data for user {UserId}", userId);
                return StatusCode(500, "Error getting user exercise data");
            }
        }
    }
}
