// Implicit Goal Completion Checker
// Checks which goals a user has already satisfied conditions for (without explicitly adding them)

import i18n from 'i18next';
import { getExerciseProgress } from './progressiveGoalTracking';
import { getExerciseScores } from './autoScoring';

export interface ImplicitGoalStatus {
  title: string;
  category: string;
  difficulty: string;
  isSatisfied: boolean;
  reason: string; // Why it's satisfied
}

// Helper function to get translated satisfaction reasons
function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(`satisfaction-reasons.${key}`, { ns: 'goalsetting', ...options });
}

// Helper function to translate method names
function translateMethodName(method: string): string {
  const methodTranslations: Record<string, string> = {
    'substitution': i18n.t('categories.method-mastery', { ns: 'goalsetting' }).includes('Lösungsverfahren') ? 'Einsetzungsverfahren' : 'Substitution',
    'elimination': i18n.t('categories.method-mastery', { ns: 'goalsetting' }).includes('Lösungsverfahren') ? 'Additionsverfahren' : 'Elimination',
    'equalization': i18n.t('categories.method-mastery', { ns: 'goalsetting' }).includes('Lösungsverfahren') ? 'Gleichsetzungsverfahren' : 'Equalization'
  };
  return methodTranslations[method] || method;
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
      return t(progress.total !== 1 ? 'completed-exercises_plural' : 'completed-exercises', { count: progress.total });
      
    case "Understand how substitution works":
      return t(progress.substitution !== 1 ? 'completed-substitution_plural' : 'completed-substitution', { count: progress.substitution });
      
    case "Understand how elimination works":
      return t(progress.elimination !== 1 ? 'completed-elimination_plural' : 'completed-elimination', { count: progress.elimination });
      
    case "Understand how equalization works":
      return t(progress.equalization !== 1 ? 'completed-equalization_plural' : 'completed-equalization', { count: progress.equalization });
      
    case "Master substitution/equalization/elimination method": {
      if (progress.substitution >= 2) return t('mastered-substitution', { count: progress.substitution });
      if (progress.elimination >= 2) return t('mastered-elimination', { count: progress.elimination });
      return t('mastered-equalization', { count: progress.equalization });
    }
      
    case "Practice with different methods": {
      const methods = [];
      if (progress.substitution > 0) methods.push(translateMethodName('substitution'));
      if (progress.elimination > 0) methods.push(translateMethodName('elimination'));
      if (progress.equalization > 0) methods.push(translateMethodName('equalization'));
      return t('used-methods', { count: methods.length, methods: methods.join(', ') });
    }
      
    case "Switch methods strategically":
      return t('completed-all-methods', { count: progress.total });
      
    case "Choose optimal methods consistently":
      return t('completed-efficiency', { count: progress.efficiency });
      
    case "Master all three methods fluently":
      return t('mastered-all-methods', { 
        substitution: progress.substitution, 
        elimination: progress.elimination, 
        equalization: progress.equalization 
      });
      
    case "Complete exercises without hints": {
      const noHintExercises = sortedScores.filter(ex => ex.hints === 0);
      return t(noHintExercises.length !== 1 ? 'completed-without-hints_plural' : 'completed-without-hints', { count: noHintExercises.length });
    }
      
    case "Solve problems with minimal errors": {
      const lowErrorExercises = sortedScores.filter(ex => ex.errors <= 1);
      return t(lowErrorExercises.length !== 1 ? 'completed-low-errors_plural' : 'completed-low-errors', { count: lowErrorExercises.length });
    }
      
    case "Handle complex problems confidently":
      return t(progress.total !== 1 ? 'completed-exercises_plural' : 'completed-exercises', { count: progress.total });
      
    case "Show exceptional problem-solving": {
      const perfectExercises = sortedScores.filter(ex => ex.hints === 0 && ex.errors === 0);
      return t(perfectExercises.length !== 1 ? 'completed-perfect_plural' : 'completed-perfect', { count: perfectExercises.length });
    }
      
    case "Maintain accuracy under pressure": {
      const recentFive = sortedScores.slice(0, 5);
      const avgErrors = recentFive.reduce((sum, ex) => sum + ex.errors, 0) / recentFive.length;
      return t('average-errors', { count: recentFive.length, average: avgErrors.toFixed(1) });
    }
      
    case "Reflect on method effectiveness":
      return t(progress.selfExplanations !== 1 ? 'self-explanations_plural' : 'self-explanations', { count: progress.selfExplanations });
      
    case "Build confidence through success": {
      const lowHintExercises = sortedScores.filter(ex => ex.hints <= 2);
      return t(lowHintExercises.length !== 1 ? 'completed-low-hints_plural' : 'completed-low-hints', { count: lowHintExercises.length });
    }
      
    case "Develop problem-solving resilience": {
      const withErrors = sortedScores.filter(ex => ex.errors >= 1);
      return t(withErrors.length !== 1 ? 'persevered-errors_plural' : 'persevered-errors', { count: withErrors.length });
    }
      
    case "Learn from mistakes effectively": {
      const recent = progress.errorHistory.slice(-3);
      const older = progress.errorHistory.slice(-6, -3);
      const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
      const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
      return t('errors-improved', { older: olderAvg.toFixed(1), recent: recentAvg.toFixed(1) });
    }
      
    case "Explain reasoning clearly":
      return t(progress.selfExplanations !== 1 ? 'self-explanations_plural' : 'self-explanations', { count: progress.selfExplanations });
      
    case "Show consistent improvement": {
      const lastFour = progress.errorHistory.slice(-4);
      return t('errors-decreased', { sequence: lastFour.join(' → ') });
    }
      
    case "Set personal learning challenges":
      return t(progress.total !== 1 ? 'completed-exercises_plural' : 'completed-exercises', { count: progress.total });
      
    case "Work independently": {
      const noHintExercises = sortedScores.filter(ex => ex.hints === 0);
      return t(noHintExercises.length !== 1 ? 'completed-without-hints_plural' : 'completed-without-hints', { count: noHintExercises.length });
    }
      
    default:
      return t('conditions-satisfied');
  }
}
