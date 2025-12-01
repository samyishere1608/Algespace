import { useCallback, useState } from "react";
import { Goal } from "@/types/goal";
import { getExerciseScores, getContributingExercises, calculateGoalScore, ExerciseScore } from "@utils/autoScoring.ts";

export function useAutoGoalCompletion(
  goals: Goal[],
  onGoalsChange: (goals: Goal[]) => void,
  onTriggerRetrospective?: (goalId: number, autoCalculatedScore?: number, contributingExercises?: ExerciseScore[]) => void // Updated to include contributing exercises
) {
  const [showCheckIn, setLocalShowCheckIn] = useState(false);
  const [agentMessage, setLocalAgentMessage] = useState<string | null>(null);

  const completeGoalByTitle = useCallback(
    async (title: string) => {
      console.log(`🔍 Auto-completion triggered for goal: "${title}"`);
      console.log(`📋 Available goals:`, goals.map(g => ({ id: g.id, title: g.title, completed: g.completed })));
      
      const matchedGoal = goals.find((g) => g.title === title && !g.completed);

      if (!matchedGoal) {
        console.warn(`❌ No matching active goal found for: "${title}"`);
        console.log(`Available active goals:`, goals.filter(g => !g.completed).map(g => g.title));
        return;
      }

      console.log(`✅ Found matching goal for auto-completion:`, matchedGoal);

      try {
        if (onTriggerRetrospective) {
          // Calculate auto score for the goal being completed
          console.log(`🧮 Calculating auto score for goal: "${title}"`);
          
          // Get the actual user ID from the system
          const { getCurrentUserId } = await import("@/utils/studySession");
          const userId = getCurrentUserId();
          console.log(`👤 Using userId: ${userId} for auto-scoring calculation`);
          
          // Get all stored exercise scores for this user
          const allExerciseScores = getExerciseScores(userId);
          console.log(`📚 Found ${allExerciseScores.length} exercise scores for user ${userId}`);
          console.warn(`🔍 [AUTOSCORING DEBUG] All exercise scores:`, allExerciseScores.map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseType: ex.exerciseType,
            method: ex.method,
            hints: ex.hints,
            errors: ex.errors,
            timestamp: ex.timestamp
          })));
          
          // Get exercises that contributed to this specific goal
          const contributingExercises = getContributingExercises(title, allExerciseScores);
          console.log(`🎯 Found ${contributingExercises.length} contributing exercises for goal "${title}"`);
          console.warn(`🔍 [AUTOSCORING DEBUG] Contributing exercises for "${title}":`, contributingExercises.map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseType: ex.exerciseType,
            method: ex.method,
            hints: ex.hints,
            errors: ex.errors
          })));
          
          let autoCalculatedScore: number | undefined = undefined;
          if (contributingExercises.length > 0) {
            const goalScoreData = calculateGoalScore(title, userId, contributingExercises);
            autoCalculatedScore = goalScoreData.finalScore;
            console.warn(`✅ [AUTOSCORING DEBUG] Auto-calculated score for "${title}": ${autoCalculatedScore} (total errors)`);
            console.warn(`🎯 [AUTOSCORING DEBUG] Goal score data:`, goalScoreData);
          } else {
            console.warn(`⚠️ [AUTOSCORING DEBUG] No contributing exercises found for "${title}" - will use manual scoring`);
            console.warn(`⚠️ [AUTOSCORING DEBUG] This means autoCalculatedScore will be UNDEFINED!`);
          }
          
          // Trigger retrospective flow for automatic goal completion
          console.log(`🎯 Triggering retrospective flow for: "${title}" with auto score: ${autoCalculatedScore}`);
          onTriggerRetrospective(matchedGoal.id, autoCalculatedScore, contributingExercises);
        } else {
          console.warn(`⚠️ No retrospective handler provided - auto-completion will not show prompts`);
        }
        
        console.log(`🎉 Auto-completion flow initiated for: "${title}"`);
      } catch (error) {
        console.error("❌ Failed to trigger auto-completion flow:", error);
      }
    },
    [goals, onTriggerRetrospective]
  );

  return {
    completeGoalByTitle,
    agentMessage,
    showCheckIn,
    setShowCheckIn: setLocalShowCheckIn,
  };
}
