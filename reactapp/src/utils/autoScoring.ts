// Automatic Scoring System for Goal Completion
// Handles both single-exercise and multi-exercise goal scoring

export interface ExerciseScore {
  exerciseId: number;
  userId: number;
  exerciseType: string;
  method: string;
  hints: number;
  errors: number;
  completedWithSelfExplanation: boolean;
  timestamp: number;
  
  // Calculated performance score (0-100)
  performanceScore: number;
}

export interface GoalScoreData {
  goalTitle: string;
  userId: number;
  
  // All exercises that contributed to this goal
  contributingExercises: ExerciseScore[];
  
  // Final calculated score
  finalScore: number;
  
  // Scoring method used
  scoringMethod: 'single' | 'average' | 'weighted' | 'improvement' | 'consistency';
  
  // Completion timestamp
  timestamp: number;
}

// Mistake-based scoring function - returns number of errors (mistakes)
export function calculatePerformanceScore(
  hints: number, 
  errors: number, 
  completedWithSelfExplanation: boolean
): number {
  console.log(`🧮 Calculating mistakes count: errors=${errors} (hints ignored)`);
  console.log(`📊 Mistakes Count: ${errors} errors made`);
  console.log(`🔍 DEBUG TRACE: calculatePerformanceScore called with hints=${hints}, errors=${errors}, selfExplanation=${completedWithSelfExplanation}`);
  
  // Return the number of errors as the "score" (actually mistake count)
  // This will be displayed as "X mistakes" instead of a percentage
  return errors;
}

// Store individual exercise score
export function saveExerciseScore(exerciseScore: ExerciseScore): void {
  const key = `exerciseScores_${exerciseScore.userId}`;
  const stored = localStorage.getItem(key);
  let scores: ExerciseScore[] = [];
  
  if (stored) {
    try {
      scores = JSON.parse(stored);
    } catch (error) {
      console.log("Error parsing stored scores, starting fresh...");
    }
  }
  
  scores.push(exerciseScore);
  localStorage.setItem(key, JSON.stringify(scores));
  
  console.log(`💾 Saved exercise score:`, exerciseScore);
}

// Get all exercise scores for a user
export function getExerciseScores(userId: number): ExerciseScore[] {
  const key = `exerciseScores_${userId}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.log("Error parsing stored scores");
    }
  }
  
  return [];
}

// Define goal completion patterns and their scoring strategies
export const GOAL_SCORING_STRATEGIES = {
  // Goals that complete after 1 exercise
  'single_exercise': {
    goals: [
      "Learn what linear equations are",
      "Understand how substitution works", 
      "Understand how elimination works",
      "Understand how equalization works",
      "Develop problem-solving resilience",
      "Complete exercises without hints", // Single hint-free exercise
      "Build confidence through success", // Single low-hint exercise
      "Solve problems with minimal errors", // Single low-error exercise
      "Reflect on method effectiveness", // Single exercise with self-explanation
      "Learn from mistakes effectively" // Single exercise showing improvement
    ],
    scoringMethod: 'single' as const
  },  // Goals that need multiple exercises - use average
  'multiple_average': {
    goals: [
      "Master substitution/equalization/elimination method", // 2 exercises
      "Practice with different methods", // 2+ methods
      "Switch methods strategically", // 3 exercises
      "Choose optimal methods consistently", // 3 exercises
      "Master all three methods fluently", // 2+ in each method
      "Track progress meaningfully", // 3+ methods
      "Explain reasoning clearly", // 3 exercises with self-explanation
      "Show consistent improvement", // improvement trend over 4+ exercises
      "Maintain accuracy under pressure" // avg ≤1 error over 5+ exercises
    ],
    scoringMethod: 'average' as const
  },
  
  // Goals about progression - use improvement scoring
  'progression_based': {
    goals: [
      "Handle complex problems confidently", // 5 exercises
      "Show exceptional problem-solving", // 0 errors + 0 hints
      "Set personal learning challenges", // 10 exercises
      "Work independently" // 3 hint-free exercises
    ],
    scoringMethod: 'improvement' as const
  }
};

// Calculate final score for a goal based on its strategy
export function calculateGoalScore(
  goalTitle: string,
  userId: number,
  contributingExercises: ExerciseScore[]
): GoalScoreData {
  console.log(`🎯 Calculating goal score for: "${goalTitle}"`);
  console.log(`📝 Contributing exercises:`, contributingExercises);
  
  let scoringMethod: GoalScoreData['scoringMethod'] = 'single';
  let finalScore = 0;
  
  // Determine scoring strategy
  for (const strategy of Object.values(GOAL_SCORING_STRATEGIES)) {
    if (strategy.goals.includes(goalTitle)) {
      scoringMethod = strategy.scoringMethod;
      break;
    }
  }
  
  if (contributingExercises.length === 0) {
    console.warn(`⚠️ No contributing exercises found for goal: ${goalTitle}`);
    finalScore = 0; // Default to 0 mistakes when no exercises found
  } else if (scoringMethod === 'single') {
    // Use the single exercise score
    finalScore = contributingExercises[0].performanceScore;
  } else if (scoringMethod === 'average') {
    // Average all exercise scores
    const sum = contributingExercises.reduce((acc, ex) => acc + ex.performanceScore, 0);
    finalScore = Math.round(sum / contributingExercises.length);
  } else if (scoringMethod === 'improvement') {
    // Weight later exercises more heavily (showing improvement)
    const weights = contributingExercises.map((_, i) => i + 1); // 1, 2, 3, 4, 5...
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    const weightedSum = contributingExercises.reduce((acc, ex, i) => 
      acc + (ex.performanceScore * weights[i]), 0
    );
    finalScore = Math.round(weightedSum / totalWeight);
  }
  
  const goalScore: GoalScoreData = {
    goalTitle,
    userId,
    contributingExercises,
    finalScore,
    scoringMethod,
    timestamp: Date.now()
  };
  
  console.log(`✅ Goal score calculated:`, goalScore);
  return goalScore;
}

// Main function to handle exercise completion and goal scoring
export function handleExerciseCompletion(
  userId: number,
  exerciseId: number,
  exerciseType: string,
  method: string,
  hints: number,
  errors: number,
  completedWithSelfExplanation: boolean
): ExerciseScore {
  
  console.log(`🎯 AUTO-SCORING: handleExerciseCompletion called for user ${userId}, exercise ${exerciseId}`);
  console.log(`📊 Exercise data: type=${exerciseType}, method=${method}, hints=${hints}, errors=${errors}, selfExplanation=${completedWithSelfExplanation}`);
  
  // Calculate performance score for this exercise
  const performanceScore = calculatePerformanceScore(hints, errors, completedWithSelfExplanation);
  
  // Create exercise score record
  const exerciseScore: ExerciseScore = {
    exerciseId,
    userId,
    exerciseType,
    method,
    hints,
    errors,
    completedWithSelfExplanation,
    timestamp: Date.now(),
    performanceScore
  };
  
  // Save the score
  saveExerciseScore(exerciseScore);
  
  return exerciseScore;
}

// Get contributing exercises for a specific goal completion
export function getContributingExercises(
  goalTitle: string,
  allExerciseScores: ExerciseScore[]
): ExerciseScore[] {
  
  console.log(`🔍 Finding contributing exercises for goal: "${goalTitle}"`);
  console.log(`📚 Total available exercise scores: ${allExerciseScores.length}`);
  
  // Sort exercises by timestamp (oldest first)
  const sortedExercises = [...allExerciseScores].sort((a, b) => a.timestamp - b.timestamp);
  
  // Define logic for each goal type
  switch (goalTitle) {
    case "Learn what linear equations are":
      // Most recent exercise (for re-attempts)
      return sortedExercises.length > 0 ? [sortedExercises[sortedExercises.length - 1]] : [];
      
    case "Understand how substitution works":
      // Most recent substitution exercise (for re-attempts)
      const substitutionExercises = sortedExercises.filter(ex => 
        ex.method.toLowerCase() === 'substitution' || ex.method === '1'
      );
      return substitutionExercises.length > 0 ? [substitutionExercises[substitutionExercises.length - 1]] : [];
      
    case "Understand how elimination works":
      // Most recent elimination exercise (for re-attempts)
      const eliminationExercises = sortedExercises.filter(ex => 
        ex.method.toLowerCase() === 'elimination' || ex.method === '2'
      );
      return eliminationExercises.length > 0 ? [eliminationExercises[eliminationExercises.length - 1]] : [];
      
    case "Understand how equalization works":
      // Most recent equalization exercise (for re-attempts)
      const equalizationExercises = sortedExercises.filter(ex => 
        ex.method.toLowerCase() === 'equalization' || ex.method === '0'
      );
      return equalizationExercises.length > 0 ? [equalizationExercises[equalizationExercises.length - 1]] : [];
      
    case "Master substitution/equalization/elimination method":
      // First 2 exercises of any single method that reaches 2+ completions
      const methodCounts = { substitution: 0, elimination: 0, equalization: 0 };
      const methodExercises: { substitution: ExerciseScore[], elimination: ExerciseScore[], equalization: ExerciseScore[] } = { 
        substitution: [], 
        elimination: [], 
        equalization: [] 
      };
      
      for (const ex of sortedExercises) {
        const method = ex.method.toLowerCase();
        if (method === 'substitution' || method === '1') {
          methodCounts.substitution++;
          methodExercises.substitution.push(ex);
        } else if (method === 'elimination' || method === '2') {
          methodCounts.elimination++;
          methodExercises.elimination.push(ex);
        } else if (method === 'equalization' || method === '0') {
          methodCounts.equalization++;
          methodExercises.equalization.push(ex);
        }
      }
      
      // Return first 2 exercises of the first method to reach 2+ completions
      if (methodCounts.substitution >= 2) return methodExercises.substitution.slice(0, 2);
      if (methodCounts.elimination >= 2) return methodExercises.elimination.slice(0, 2);
      if (methodCounts.equalization >= 2) return methodExercises.equalization.slice(0, 2);
      return [];
      
    case "Switch methods strategically":
      // First 3 exercises using different methods
      const uniqueMethods: string[] = [];
      const strategicExercises: ExerciseScore[] = [];
      for (const ex of sortedExercises) {
        if (!uniqueMethods.includes(ex.method) && strategicExercises.length < 3) {
          uniqueMethods.push(ex.method);
          strategicExercises.push(ex);
        }
      }
      return strategicExercises;
      
    case "Choose optimal methods consistently":
      // First 3 efficiency exercises
      return sortedExercises.filter(ex => 
        ex.exerciseType.toLowerCase() === 'efficiency'
      ).slice(0, 3);
      
    case "Handle complex problems confidently":
      // First 5 exercises total
      return sortedExercises.slice(0, 5);
      
    case "Explain reasoning clearly":
      // First 3 exercises with self-explanation
      return sortedExercises.filter(ex => 
        ex.completedWithSelfExplanation
      ).slice(0, 3);
      
    case "Set personal learning challenges":
      // First 10 exercises total
      return sortedExercises.slice(0, 10);
      
    case "Develop problem-solving resilience":
      // MOST RECENT exercise with errors > 0 (use latest attempt, not oldest)
      const resilienceExercises = sortedExercises.filter(ex => ex.errors > 0);
      return resilienceExercises.length > 0 ? [resilienceExercises[resilienceExercises.length - 1]] : [];
      
    case "Complete exercises without hints":
      // MOST RECENT exercise with 0 hints (use latest attempt, not oldest)
      const noHintExercises = sortedExercises.filter(ex => ex.hints === 0);
      return noHintExercises.length > 0 ? [noHintExercises[noHintExercises.length - 1]] : [];
      
    case "Build confidence through success":
      // MOST RECENT exercise with ≤2 hints (use latest attempt, not oldest)
      const lowHintExercises = sortedExercises.filter(ex => ex.hints <= 2);
      return lowHintExercises.length > 0 ? [lowHintExercises[lowHintExercises.length - 1]] : [];
      
    case "Solve problems with minimal errors":
      // MOST RECENT exercise with ≤1 errors (use latest attempt, not oldest)
      const minimalErrorExercises = sortedExercises.filter(ex => ex.errors <= 1);
      return minimalErrorExercises.length > 0 ? [minimalErrorExercises[minimalErrorExercises.length - 1]] : [];
      
    case "Reflect on method effectiveness":
      // MOST RECENT exercise with self-explanation (use latest attempt, not oldest)
      const selfExplanationExercises = sortedExercises.filter(ex => ex.completedWithSelfExplanation);
      return selfExplanationExercises.length > 0 ? [selfExplanationExercises[selfExplanationExercises.length - 1]] : [];
      
    case "Learn from mistakes effectively":
      // MOST RECENT exercise showing improvement (use latest improvement, not first)
      if (sortedExercises.length < 2) {
        // If only 1 exercise, use it
        return sortedExercises.length > 0 ? [sortedExercises[sortedExercises.length - 1]] : [];
      }
      // Check from most recent backwards for improvement
      for (let i = sortedExercises.length - 1; i > 0; i--) {
        if (sortedExercises[i].errors < sortedExercises[i-1].errors) {
          return [sortedExercises[i]]; // Return most recent improvement
        }
      }
      // If no improvement found, return most recent exercise
      return sortedExercises.length > 0 ? [sortedExercises[sortedExercises.length - 1]] : [];
      
    case "Practice with different methods":
      // First exercises using 2+ different methods
      const usedMethods: string[] = [];
      const diverseExercises: ExerciseScore[] = [];
      for (const ex of sortedExercises) {
        if (!usedMethods.includes(ex.method) && diverseExercises.length < 2) {
          usedMethods.push(ex.method);
          diverseExercises.push(ex);
        }
      }
      return diverseExercises;
      
    case "Master all three methods fluently":
      // All exercises from all methods for averaging
      return sortedExercises;
      
    case "Track progress meaningfully":
      // All exercises across 3+ methods
      return sortedExercises;
      
    case "Show consistent improvement":
      // First 4+ exercises showing improvement trend
      return sortedExercises.slice(0, Math.max(4, sortedExercises.length));
      
    case "Maintain accuracy under pressure":
      // First 5+ exercises for accuracy averaging
      return sortedExercises.slice(0, Math.max(5, sortedExercises.length));
      
    case "Show exceptional problem-solving":
      // MOST RECENT exercise with 0 errors and 0 hints (use latest perfect performance)
      const perfectExercises = sortedExercises.filter(ex => ex.errors === 0 && ex.hints === 0);
      return perfectExercises.length > 0 ? [perfectExercises[perfectExercises.length - 1]] : [];
      
    case "Work independently":
      // First 3 exercises with 0 hints
      return sortedExercises.filter(ex => ex.hints === 0).slice(0, 3);
      
    default:
      console.warn(`⚠️ Unknown goal for contributing exercises: ${goalTitle}`);
      return [];
  }
}

// Store goal completion score
export function saveGoalScore(goalScore: GoalScoreData): void {
  const key = `goalScores_${goalScore.userId}`;
  const stored = localStorage.getItem(key);
  let scores: GoalScoreData[] = [];
  
  if (stored) {
    try {
      scores = JSON.parse(stored);
    } catch (error) {
      console.log("Error parsing stored goal scores, starting fresh...");
    }
  }
  
  scores.push(goalScore);
  localStorage.setItem(key, JSON.stringify(scores));
  
  console.log(`🎯 Saved goal score:`, goalScore);
}