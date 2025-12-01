// Progressive Goal Tracking Utility
// Simple tracking system that leverages existing data to enable progressive goals

export interface ExerciseProgress {
  // Method-based completion counts
  substitution: number;
  elimination: number;
  equalization: number;
  
  // Exercise type completion counts  
  suitability: number;
  efficiency: number;
  matching: number;
  
  // Total counts
  total: number;
  
  // Error tracking for improvement goals
  errorHistory: number[];
  
  // Self-explanation count for reflection goals
  selfExplanations: number;
}

export interface ExerciseSession {
  hints: number;
  errors: number;
  method: string;
  exerciseType: string;
  completedWithSelfExplanation: boolean;
}

// Initialize or get existing progress from localStorage
export function getExerciseProgress(userId: number): ExerciseProgress {
  const key = `exerciseProgress_${userId}`;
  const stored = localStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.log("Error parsing stored progress, resetting...");
    }
  }
  
  // Default progress state
  return {
    substitution: 0,
    elimination: 0,
    equalization: 0,
    suitability: 0,
    efficiency: 0,
    matching: 0,
    total: 0,
    errorHistory: [],
    selfExplanations: 0
  };
}

// Save progress to localStorage
export function saveExerciseProgress(userId: number, progress: ExerciseProgress): void {
  const key = `exerciseProgress_${userId}`;
  localStorage.setItem(key, JSON.stringify(progress));
}

// Update progress with a completed exercise session
export function updateExerciseProgress(
  userId: number, 
  session: ExerciseSession
): ExerciseProgress {
  
  const progress = getExerciseProgress(userId);
  
  // Update method counts - handle both numeric enum values and string names
  const method = session.method.toLowerCase();
  console.log(`📊 Processing method: "${method}" (original: "${session.method}")`);
  console.log(`📊 Method checks: equalization=${method === 'equalization'}, 0=${method === '0'}, elimination=${method === 'elimination'}, 2=${method === '2'}, substitution=${method === 'substitution'}, 1=${method === '1'}`);
  
  if (method === 'substitution' || method === '1') {
    progress.substitution++;
    console.log(`📊 Updated substitution count: ${progress.substitution}`);
  } else if (method === 'elimination' || method === '2') {
    progress.elimination++;
    console.log(`📊 Updated elimination count: ${progress.elimination}`);
  } else if (method === 'equalization' || method === '0') {
    progress.equalization++;
    console.log(`📊 Updated equalization count: ${progress.equalization}`);
  } else {
    console.log(`⚠️ Unknown method: "${method}" - this method will not be tracked!`);
  }
  
  // Update exercise type counts
  const exerciseType = session.exerciseType.toLowerCase();
  if (exerciseType === 'suitability') progress.suitability++;
  else if (exerciseType === 'efficiency') progress.efficiency++;
  else if (exerciseType === 'matching') progress.matching++;
  
  // Update total count
  progress.total++;
  
  // Track error history (for improvement goals)
  progress.errorHistory.push(session.errors);
  
  // Track self-explanations
  if (session.completedWithSelfExplanation) {
    progress.selfExplanations++;
  }
  
  // Save updated progress
  saveExerciseProgress(userId, progress);
  
  console.log(`📊 Updated exercise progress:`, progress);
  
  return progress;
}

// Check if user shows improvement (fewer errors over time)
export function checkErrorImprovement(errorHistory: number[], minExercises: number = 2): boolean {
  if (errorHistory.length < minExercises) return false;
  
  // Simple improvement check: compare first half to second half
  const midPoint = Math.floor(errorHistory.length / 2);
  const firstHalfAvg = errorHistory.slice(0, midPoint).reduce((sum, errors) => sum + errors, 0) / midPoint;
  const secondHalfAvg = errorHistory.slice(midPoint).reduce((sum, errors) => sum + errors, 0) / (errorHistory.length - midPoint);
  
  return secondHalfAvg < firstHalfAvg;
}

// Check if user shows consistent improvement trend
export function checkConsistentImprovement(errorHistory: number[], minExercises: number = 4): boolean {
  if (errorHistory.length < minExercises) return false;
  
  // Check if recent exercises have lower error rates
  const recentCount = Math.min(3, Math.floor(errorHistory.length / 2));
  const recent = errorHistory.slice(-recentCount);
  const earlier = errorHistory.slice(0, errorHistory.length - recentCount);
  
  const recentAvg = recent.reduce((sum, errors) => sum + errors, 0) / recent.length;
  const earlierAvg = earlier.reduce((sum, errors) => sum + errors, 0) / earlier.length;
  
  return recentAvg < earlierAvg;
}

// Save exercise session data for individual exercise tracking
export function saveExerciseSession(userId: number, exerciseType: string, exerciseId: number, session: ExerciseSession): void {
  const key = `exerciseSession_${userId}_${exerciseType}_${exerciseId}`;
  const sessionData = {
    hints: session.hints,
    errors: session.errors,
    timestamp: Date.now(),
    method: session.method,
    completedWithSelfExplanation: session.completedWithSelfExplanation
  };
  
  // Clear any previous session for this same exercise before saving new one
  // This ensures we only keep the LATEST attempt
  sessionStorage.removeItem(key);
  sessionStorage.setItem(key, JSON.stringify(sessionData));
  console.log(`💾 Saved LATEST exercise session data for ${exerciseType} exercise ${exerciseId}:`, sessionData);
}

// Get exercise session data for a specific exercise
export function getExerciseSession(userId: number, exerciseType: string, exerciseId: number): {hints: number, errors: number, timestamp?: number, method?: string, completedWithSelfExplanation?: boolean} | null {
  const key = `exerciseSession_${userId}_${exerciseType}_${exerciseId}`;
  const stored = sessionStorage.getItem(key);
  
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.warn(`Failed to parse exercise session data for ${exerciseType} exercise ${exerciseId}:`, error);
    }
  }
  
  return null;
}

// Clear exercise session data for a specific exercise (after goal completion)
export function clearExerciseSession(userId: number, exerciseType: string, exerciseId: number): void {
  const key = `exerciseSession_${userId}_${exerciseType}_${exerciseId}`;
  sessionStorage.removeItem(key);
  console.log(`🧹 Cleared exercise session data for ${exerciseType} exercise ${exerciseId}`);
}

// Clear all old exercise sessions for a user (cleanup utility)
export function clearAllExerciseSessions(userId: number): void {
  const keysToRemove: string[] = [];
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && key.startsWith(`exerciseSession_${userId}_`)) {
      keysToRemove.push(key);
    }
  }
  keysToRemove.forEach(key => sessionStorage.removeItem(key));
  console.log(`🧹 Cleared ${keysToRemove.length} exercise session(s) for user ${userId}`)
}

// Main function to check and trigger progressive goals
export function checkProgressiveGoals(
  userId: number, 
  session: ExerciseSession,
  completeGoalByTitle: (title: string) => void,
  exerciseId?: number
): string[] {
  
  console.log(`🚀 ===== PROGRESSIVE GOALS CHECK STARTED =====`);
  console.log(`🎯 User ID: ${userId}`);
  console.log(`🎯 Session data:`, session);
  console.log(`🎯 Exercise ID: ${exerciseId}`);
  
  // Save per-exercise session data if exerciseId is provided
  if (exerciseId) {
    saveExerciseSession(userId, session.exerciseType, exerciseId, session);
  }
  
  // Test the complete function first
  console.log(`🧪 Testing completeGoalByTitle function...`);
  if (typeof completeGoalByTitle === 'function') {
    console.log(`✅ completeGoalByTitle is a valid function`);
  } else {
    console.error(`❌ completeGoalByTitle is not a function:`, completeGoalByTitle);
    return [];
  }
  
  // Update progress with this session
  const progress = updateExerciseProgress(userId, session);
  
  console.log(`📊 Current progress after update:`, progress);
  
  // Collect all completed goals instead of triggering them immediately
  const completedGoals: string[] = [];
  
  // 📚 Understanding Category Goals
  
  console.log(`🔍 Checking substitution method: session.method="${session.method}", progress.substitution=${progress.substitution}`);
  console.log(`🔍 MASTERY CHECK: substitution=${progress.substitution} >= 2? ${progress.substitution >= 2}, elimination=${progress.elimination} >= 2? ${progress.elimination >= 2}, equalization=${progress.equalization} >= 2? ${progress.equalization >= 2}`);
  
  // Basic method understanding (first completion of each method)
  const methodStr = session.method.toLowerCase();
  if ((methodStr === 'substitution' || methodStr === '1') && progress.substitution >= 1) {
    console.log(`🎯 GOAL COMPLETED: "Understand how substitution works" (substitution count: ${progress.substitution})`);
    completedGoals.push("Understand how substitution works");
  } else {
    console.log(`❌ Not triggering "Understand how substitution works" - method: ${methodStr}, count: ${progress.substitution}`);
  }
  
  // Method mastery (second completion of any method)
  if (progress.substitution >= 2 || progress.elimination >= 2 || progress.equalization >= 2) {
    const masteredMethod = progress.substitution >= 2 ? 'substitution' : 
                          progress.elimination >= 2 ? 'elimination' : 'equalization';
    console.log(`🎯 GOAL COMPLETED: "Master substitution/equalization/elimination method" (mastered ${masteredMethod} with 2+ completions)`);
    completedGoals.push("Master substitution/equalization/elimination method");
  } else {
    console.log(`❌ Not triggering "Master substitution/equalization/elimination method" - substitution: ${progress.substitution}, elimination: ${progress.elimination}, equalization: ${progress.equalization} (need 2+ in any method)`);
  }
  
  // First-time elimination completion
  if ((methodStr === 'elimination' || methodStr === '2') && progress.elimination >= 1) {
    console.log(`🎯 GOAL COMPLETED: "Understand how elimination works" (first elimination completion)`);
    completedGoals.push("Understand how elimination works");
  }
  
  // First-time equalization completion  
  console.log(`🔍 Checking equalization method: session.method="${session.method}", progress.equalization=${progress.equalization}`);
  console.log(`🔍 Method checks for equalization: methodStr="${methodStr}", equalization=${methodStr === 'equalization'}, 0=${methodStr === '0'}, count=${progress.equalization}`);
  
  if ((methodStr === 'equalization' || methodStr === '0') && progress.equalization >= 1) {
    console.log(`🎯 GOAL COMPLETED: "Understand how equalization works" (first equalization completion)`);
    completedGoals.push("Understand how equalization works");
  } else {
    console.log(`❌ Not triggering "Understand how equalization works" - method: ${methodStr}, count: ${progress.equalization}`);
  }
  
  // First exercise completion (for "Learn what linear equations are")
  if (progress.total >= 1) {
    console.log(`🎯 GOAL COMPLETED: "Learn what linear equations are" (first exercise completed)`);
    completedGoals.push("Learn what linear equations are");
  }
  
  // Master all methods (2+ each)
  if (progress.substitution >= 2 && progress.elimination >= 2 && progress.equalization >= 2) {
    console.log(`🎯 GOAL COMPLETED: "Master all three methods fluently"`);
    completedGoals.push("Master all three methods fluently");
  }
  
  // 🎯 Strategy Use Category Goals
  
  // Method variety (2 different methods)
  const methodsUsed = [progress.substitution, progress.elimination, progress.equalization].filter(count => count > 0).length;
  console.log(`🎯 Checking "Practice with different methods" - methods used: ${methodsUsed}/3`);
  if (methodsUsed >= 2) {
    console.log(`🎯 GOAL COMPLETED: "Practice with different methods" (${methodsUsed} different methods)`);
    completedGoals.push("Practice with different methods");
  } else {
    console.log(`❌ Not triggering "Practice with different methods" - only ${methodsUsed} methods used`);
  }
  
  // Strategic switching (3 exercises with variety)
  if (progress.total >= 3 && methodsUsed >= 3) {
    console.log(`🎯 GOAL COMPLETED: "Switch methods strategically"`);
    completedGoals.push("Switch methods strategically");
  }
  
  // Optimal method choice (3 efficiency exercises)
  if (progress.efficiency >= 3) {
    console.log(`🎯 GOAL COMPLETED: "Choose optimal methods consistently"`);
    completedGoals.push("Choose optimal methods consistently");
  }
  
  // 💭 Reflection Category Goals
  
  // Method effectiveness reflection (self-explanation)
  if (session.completedWithSelfExplanation) {
    console.log(`🎯 GOAL COMPLETED: "Reflect on method effectiveness" (completed with explanation)`);
    completedGoals.push("Reflect on method effectiveness");
  } else {
    console.log(`❌ Not triggering "Reflect on method effectiveness" - no self-explanation provided`);
  }
  
  // Clear reasoning (3 self-explanations)
  if (progress.selfExplanations >= 3) {
    console.log(`🎯 GOAL COMPLETED: "Explain reasoning clearly"`);
    completedGoals.push("Explain reasoning clearly");
  }
  
  // Consistent improvement (trend over 4+ exercises)
  if (checkConsistentImprovement(progress.errorHistory, 4)) {
    console.log(`🎯 GOAL COMPLETED: "Show consistent improvement"`);
    completedGoals.push("Show consistent improvement");
  }
  
  // 🎯 Learning & Growth Category Goals
  
  // Build confidence through success (2 or fewer hints)
  if (session.hints <= 2) {
    console.log(`🎯 GOAL COMPLETED: "Build confidence through success" (${session.hints} hints used)`);
    completedGoals.push("Build confidence through success");
  }
  
  // Independence (0 hints) - UPDATED
  if (session.hints === 0) {
    console.log(`🎯 GOAL COMPLETED: "Complete exercises without hints" (0 hints used)`);
    completedGoals.push("Complete exercises without hints");
  } else {
    console.log(`❌ Not triggering "Complete exercises without hints" - hints used: ${session.hints}`);
  }
  
  // Build confidence (5 total exercises) - UPDATED
  if (progress.total >= 5) {
    console.log(`🎯 GOAL COMPLETED: "Handle complex problems confidently" (5+ exercises)`);
    completedGoals.push("Handle complex problems confidently");
  } else {
    console.log(`❌ Not triggering "Handle complex problems confidently" (${progress.total}/5 exercises)`);
  }
  
  // Independence mastery (3 exercises with 0 hints each) - UPDATED TITLE
  if (session.hints === 0) {
    console.log(`🏆 Processing hint-free exercise for "Work independently" mastery`);
    // Track and check for multiple hint-free exercises
    const recentHintFreeExercises = getRecentHintFreeCount(userId);
    incrementHintFreeCount(userId);
    console.log(`🏆 Hint-free exercises count: ${recentHintFreeExercises + 1}/3`);
    if (recentHintFreeExercises + 1 >= 3) {
      console.log(`🎯 GOAL COMPLETED: "Work independently" (3 hint-free exercises achieved)`);
      completedGoals.push("Work independently");
    } else {
      console.log(`❌ Not triggering "Work independently" (${recentHintFreeExercises + 1}/3 hint-free exercises)`);
    }
  }
  
  // NEW: Minimal errors goal
  if (session.errors <= 1) {
    console.log(`🎯 GOAL COMPLETED: "Solve problems with minimal errors" (${session.errors} errors ≤ 1)`);
    completedGoals.push("Solve problems with minimal errors");
  } else {
    console.log(`❌ Not triggering "Solve problems with minimal errors" (${session.errors} errors > 1)`);
  }
  
  // NEW: Exceptional problem-solving (0 errors AND 0 hints)
  if (session.errors === 0 && session.hints === 0) {
    console.log(`🎯 GOAL COMPLETED: "Show exceptional problem-solving" (perfect: 0 errors, 0 hints)`);
    completedGoals.push("Show exceptional problem-solving");
  } else {
    console.log(`❌ Not triggering "Show exceptional problem-solving" (errors: ${session.errors}, hints: ${session.hints})`);
  }
  
  // NEW: Maintain accuracy under pressure (≤1 error average across 5+ exercises)
  if (progress.total >= 5) {
    const avgErrors = progress.errorHistory.reduce((sum, err) => sum + err, 0) / progress.errorHistory.length;
    console.log(`🎯 Checking accuracy under pressure: ${progress.total} exercises, avg errors = ${avgErrors.toFixed(2)}`);
    if (avgErrors <= 1) {
      console.log(`🎯 GOAL COMPLETED: "Maintain accuracy under pressure" (avg ≤1 error over 5+ exercises)`);
      completedGoals.push("Maintain accuracy under pressure");
    } else {
      console.log(`❌ Not triggering "Maintain accuracy under pressure" (avg ${avgErrors.toFixed(2)} > 1.0)`);
    }
  } else {
    console.log(`❌ Not enough exercises for "Maintain accuracy under pressure" (${progress.total}/5)`);
  }
  
  // 📚 Additional Learning & Growth Goals
  
  // Develop problem-solving resilience (complete after making errors)
  if (session.errors > 0) {
    console.log(`🎯 GOAL COMPLETED: "Develop problem-solving resilience" (persisted through ${session.errors} errors)`);
    completedGoals.push("Develop problem-solving resilience");
  }
  
  // Learn from mistakes effectively (improved error rate over time)
  if (progress.total >= 3) {
    const recentErrors = progress.errorHistory.slice(-3); // Last 3 exercises
    const oldErrors = progress.errorHistory.slice(0, -3); // Earlier exercises
    if (oldErrors.length > 0) {
      const recentAvg = recentErrors.reduce((sum, err) => sum + err, 0) / recentErrors.length;
      const oldAvg = oldErrors.reduce((sum, err) => sum + err, 0) / oldErrors.length;
      console.log(`🎯 Checking mistake learning: recent avg = ${recentAvg.toFixed(2)}, old avg = ${oldAvg.toFixed(2)}`);
      if (recentAvg < oldAvg) {
        console.log(`🎯 GOAL COMPLETED: "Learn from mistakes effectively" (improving error rate)`);
        completedGoals.push("Learn from mistakes effectively");
      }
    }
  }
  
  // Set personal learning challenges (complete 10+ exercises)
  if (progress.total >= 10) {
    console.log(`🎯 GOAL COMPLETED: "Set personal learning challenges" (10+ exercises completed)`);
    completedGoals.push("Set personal learning challenges");
  }
  
  console.log(`✅ Progressive goal check complete - ${completedGoals.length} goals completed:`, completedGoals);
  
  // Return the list of completed goals - let the caller handle triggering them in sequence
  return completedGoals;
}

// Helper function to track hint-free exercises (simplified implementation)
function getRecentHintFreeCount(userId: number): number {
  const key = `hintFreeCount_${userId}`;
  const count = parseInt(localStorage.getItem(key) || "0");
  return count;
}

export function incrementHintFreeCount(userId: number): void {
  const key = `hintFreeCount_${userId}`;
  const current = parseInt(localStorage.getItem(key) || "0");
  localStorage.setItem(key, (current + 1).toString());
}

// Reset progress (for testing or new users)
export function resetExerciseProgress(userId: number): void {
  const key = `exerciseProgress_${userId}`;
  localStorage.removeItem(key);
  localStorage.removeItem(`hintFreeCount_${userId}`);
  console.log(`🔄 Reset exercise progress for user ${userId}`);
}

// Display comprehensive progressive goal tracking stats
export function displayProgressiveStats(userId: number): void {
  const progress = getExerciseProgress(userId);
  const hintFreeCount = getRecentHintFreeCount(userId);
  
  console.log(`
📊 === PROGRESSIVE GOAL TRACKING STATS (User: ${userId}) ===

🎯 EXERCISE COMPLETION COUNTS:
   Total Exercises: ${progress.total}
   Methods use : ${progress.substitution + progress.elimination + progress.equalization}
   📝 Substitution: ${progress.substitution}
   ➖ Elimination: ${progress.elimination} 
   ⚖️  Equalization: ${progress.equalization}
   
🎮 EXERCISE TYPE COUNTS:
   🟢 Suitability (Easy): ${progress.suitability}
   🟡 Efficiency (Medium): ${progress.efficiency}
   🔴 Matching (Hard): ${progress.matching}
   
❌ ERROR TRACKING:
   Error History: [${progress.errorHistory.join(', ')}]
   Recent Average: ${progress.errorHistory.length > 0 ? (progress.errorHistory.reduce((sum, err) => sum + err, 0) / progress.errorHistory.length).toFixed(2) : '0.00'}
   Last Exercise Errors: ${progress.errorHistory.length > 0 ? progress.errorHistory[progress.errorHistory.length - 1] : 0}
   
💡 HINT & REFLECTION:
   Hint-Free Exercises: ${hintFreeCount}/3
   Self-Explanations: ${progress.selfExplanations}
   
🎖️ GOAL PROGRESS INDICATORS:
   Ready for "Learn what linear equations are": ${progress.total >= 1 ? '✅' : '❌'}
   Ready for "Master all three methods fluently": ${progress.substitution >= 2 && progress.elimination >= 2 && progress.equalization >= 2 ? '✅' : '❌'}
   Ready for "Handle complex problems confidently": ${progress.total >= 5 ? '✅' : '❌'}
   Ready for "Work independently": ${hintFreeCount >= 3 ? '✅' : '❌'}
   Ready for "Set personal learning challenges": ${progress.total >= 10 ? '✅' : '❌'}

======================================================
`);
}

// Note: Adaptive feedback is now handled by GoalList.tsx after goal completion