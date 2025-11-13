// Implicit Goal Completion Checker
// Checks which goals a user has already satisfied conditions for (without explicitly adding them)

import { getExerciseProgress } from './progressiveGoalTracking';
import { getExerciseScores } from './autoScoring';

export interface ImplicitGoalStatus {
  title: string;
  category: string;
  difficulty: string;
  isSatisfied: boolean;
  reason: string; // Why it's satisfied
}

/**
 * Check if a specific goal's conditions are already satisfied
 * @param userId - The user ID
 * @param goalTitle - The goal title to check
 * @returns Whether the goal conditions are satisfied
 */
export function checkGoalConditionsSatisfied(userId: number, goalTitle: string): boolean {
  const progress = getExerciseProgress(userId);
  const exerciseScores = getExerciseScores(userId);
  
  // Sort by timestamp to get most recent
  const sortedScores = exerciseScores.sort((a, b) => b.timestamp - a.timestamp);
  
  switch (goalTitle) {
    // Basic Understanding
    case "Learn what linear equations are":
      return progress.total >= 1;
      
    case "Understand how substitution works":
      return progress.substitution >= 1;
      
    case "Understand how elimination works":
      return progress.elimination >= 1;
      
    case "Understand how equalization works":
      return progress.equalization >= 1;
      
    // Method Mastery
    case "Master substitution/equalization/elimination method": {
      const hasSubstitution = progress.substitution >= 2;
      const hasElimination = progress.elimination >= 2;
      const hasEqualization = progress.equalization >= 2;
      return hasSubstitution || hasElimination || hasEqualization;
    }
      
    case "Practice with different methods": {
      let methodsUsed = 0;
      if (progress.substitution > 0) methodsUsed++;
      if (progress.elimination > 0) methodsUsed++;
      if (progress.equalization > 0) methodsUsed++;
      return methodsUsed >= 2;
    }
      
    case "Switch methods strategically": {
      let methodsUsed = 0;
      if (progress.substitution > 0) methodsUsed++;
      if (progress.elimination > 0) methodsUsed++;
      if (progress.equalization > 0) methodsUsed++;
      return methodsUsed >= 3 && progress.total >= 3;
    }
      
    case "Choose optimal methods consistently":
      return progress.efficiency >= 3;
      
    case "Master all three methods fluently":
      return progress.substitution >= 2 && 
             progress.elimination >= 2 && 
             progress.equalization >= 2;
      
    // Problem Solving
    case "Complete exercises without hints": {
      const noHintExercises = sortedScores.filter(ex => ex.hints === 0);
      return noHintExercises.length >= 1;
    }
      
    case "Solve problems with minimal errors": {
      const lowErrorExercises = sortedScores.filter(ex => ex.errors <= 1);
      return lowErrorExercises.length >= 1;
    }
      
    case "Handle complex problems confidently":
      return progress.total >= 5;
      
    case "Show exceptional problem-solving": {
      const perfectExercises = sortedScores.filter(ex => ex.hints === 0 && ex.errors === 0);
      return perfectExercises.length >= 1;
    }
      
    case "Maintain accuracy under pressure": {
      if (sortedScores.length < 5) return false;
      const recentFive = sortedScores.slice(0, 5);
      const avgErrors = recentFive.reduce((sum, ex) => sum + ex.errors, 0) / recentFive.length;
      return avgErrors <= 1.0;
    }
      
    // Learning & Growth
    case "Reflect on method effectiveness":
      return progress.selfExplanations >= 1;
      
    case "Build confidence through success": {
      const lowHintExercises = sortedScores.filter(ex => ex.hints <= 2);
      return lowHintExercises.length >= 1;
    }
      
    case "Develop problem-solving resilience": {
      const withErrors = sortedScores.filter(ex => ex.errors >= 1);
      return withErrors.length >= 1;
    }
      
    case "Learn from mistakes effectively": {
      if (progress.errorHistory.length < 4) return false;
      const recent = progress.errorHistory.slice(-3);
      const older = progress.errorHistory.slice(-6, -3);
      if (older.length < 3) return false;
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      return recentAvg < olderAvg;
    }
      
    case "Explain reasoning clearly":
      return progress.selfExplanations >= 3;
      
    case "Show consistent improvement": {
      if (progress.errorHistory.length < 4) return false;
      // Check if errors are decreasing over last 4 exercises
      const lastFour = progress.errorHistory.slice(-4);
      let improving = true;
      for (let i = 1; i < lastFour.length; i++) {
        if (lastFour[i] >= lastFour[i-1]) {
          improving = false;
          break;
        }
      }
      return improving;
    }
      
    case "Set personal learning challenges":
      return progress.total >= 10;
      
    case "Work independently": {
      const noHintExercises = sortedScores.filter(ex => ex.hints === 0);
      return noHintExercises.length >= 3;
    }
      
    default:
      return false;
  }
}

/**
 * Get satisfaction reason for why a goal is already satisfied
 */
export function getGoalSatisfactionReason(userId: number, goalTitle: string): string {
  const progress = getExerciseProgress(userId);
  const exerciseScores = getExerciseScores(userId);
  const sortedScores = exerciseScores.sort((a, b) => b.timestamp - a.timestamp);
  
  switch (goalTitle) {
    case "Learn what linear equations are":
      return `You've completed ${progress.total} exercise${progress.total !== 1 ? 's' : ''}!`;
      
    case "Understand how substitution works":
      return `You've completed ${progress.substitution} substitution exercise${progress.substitution !== 1 ? 's' : ''}!`;
      
    case "Understand how elimination works":
      return `You've completed ${progress.elimination} elimination exercise${progress.elimination !== 1 ? 's' : ''}!`;
      
    case "Understand how equalization works":
      return `You've completed ${progress.equalization} equalization exercise${progress.equalization !== 1 ? 's' : ''}!`;
      
    case "Master substitution/equalization/elimination method": {
      if (progress.substitution >= 2) return `You've mastered substitution with ${progress.substitution} exercises!`;
      if (progress.elimination >= 2) return `You've mastered elimination with ${progress.elimination} exercises!`;
      return `You've mastered equalization with ${progress.equalization} exercises!`;
    }
      
    case "Practice with different methods": {
      const methods = [];
      if (progress.substitution > 0) methods.push('substitution');
      if (progress.elimination > 0) methods.push('elimination');
      if (progress.equalization > 0) methods.push('equalization');
      return `You've used ${methods.length} different methods: ${methods.join(', ')}!`;
    }
      
    case "Switch methods strategically":
      return `You've completed ${progress.total} exercises using all 3 methods!`;
      
    case "Choose optimal methods consistently":
      return `You've completed ${progress.efficiency} efficiency exercises!`;
      
    case "Master all three methods fluently":
      return `You've mastered all methods: ${progress.substitution} substitution, ${progress.elimination} elimination, ${progress.equalization} equalization!`;
      
    case "Complete exercises without hints": {
      const noHintExercises = sortedScores.filter(ex => ex.hints === 0);
      return `You've completed ${noHintExercises.length} exercise${noHintExercises.length !== 1 ? 's' : ''} without hints!`;
    }
      
    case "Solve problems with minimal errors": {
      const lowErrorExercises = sortedScores.filter(ex => ex.errors <= 1);
      return `You've completed ${lowErrorExercises.length} exercise${lowErrorExercises.length !== 1 ? 's' : ''} with ≤1 error!`;
    }
      
    case "Handle complex problems confidently":
      return `You've completed ${progress.total} exercises!`;
      
    case "Show exceptional problem-solving": {
      const perfectExercises = sortedScores.filter(ex => ex.hints === 0 && ex.errors === 0);
      return `You've completed ${perfectExercises.length} perfect exercise${perfectExercises.length !== 1 ? 's' : ''}!`;
    }
      
    case "Maintain accuracy under pressure": {
      const recentFive = sortedScores.slice(0, 5);
      const avgErrors = recentFive.reduce((sum, ex) => sum + ex.errors, 0) / recentFive.length;
      return `Your average errors over ${recentFive.length} exercises: ${avgErrors.toFixed(1)}!`;
    }
      
    case "Reflect on method effectiveness":
      return `You've provided ${progress.selfExplanations} self-explanation${progress.selfExplanations !== 1 ? 's' : ''}!`;
      
    case "Build confidence through success": {
      const lowHintExercises = sortedScores.filter(ex => ex.hints <= 2);
      return `You've completed ${lowHintExercises.length} exercise${lowHintExercises.length !== 1 ? 's' : ''} with ≤2 hints!`;
    }
      
    case "Develop problem-solving resilience": {
      const withErrors = sortedScores.filter(ex => ex.errors >= 1);
      return `You've persevered through errors in ${withErrors.length} exercise${withErrors.length !== 1 ? 's' : ''}!`;
    }
      
    case "Learn from mistakes effectively": {
      const recent = progress.errorHistory.slice(-3);
      const older = progress.errorHistory.slice(-6, -3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      return `Your errors improved from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)}!`;
    }
      
    case "Explain reasoning clearly":
      return `You've provided ${progress.selfExplanations} self-explanations!`;
      
    case "Show consistent improvement": {
      const lastFour = progress.errorHistory.slice(-4);
      return `Your errors decreased consistently: ${lastFour.join(' → ')}!`;
    }
      
    case "Set personal learning challenges":
      return `You've completed ${progress.total} exercises!`;
      
    case "Work independently": {
      const noHintExercises = sortedScores.filter(ex => ex.hints === 0);
      return `You've completed ${noHintExercises.length} exercises without hints!`;
    }
      
    default:
      return "Conditions satisfied!";
  }
}
