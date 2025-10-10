using webapi.Models;

namespace webapi.Services
{
    public interface IGoalService
{
    Goal CreateGoal(Goal goal);
    bool UpdateGoal(int id, Goal updatedGoal);
    bool DeleteGoal(int id);
    bool MarkGoalAsCompleted(int id, double? actualScore, int? hintsUsed, int? errorsMade,
        int? postSatisfaction, int? postConfidence, int? postEffort, int? postEnjoyment, int? postAnxiety);
    Goal GetGoalById(int id);
    bool SaveMotivationRating(int id, int rating);
    List<Goal> GetGoalsByUser(int userId);
}
}
