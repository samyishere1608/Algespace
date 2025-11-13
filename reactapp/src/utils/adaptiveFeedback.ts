// Adaptive Motivational Feedback System
// Generates specific, stats-based motivational messages for the pedagogical agent
// 
// ✅ ARCHITECTURE: Single Source of Truth
// - GoalsController (Backend) = Primary source for goal recommendations
// - AdaptiveFeedback (Frontend) = Focus on motivational messaging only
// - No duplicate goal suggestion logic = Consistent recommendations across system

import { getExerciseProgress, ExerciseSession } from './progressiveGoalTracking';

export interface AdaptiveFeedbackData {
  // Exercise session data
  hints: number;
  errors: number;
  method: string;
  exerciseType: string;
  completedWithSelfExplanation: boolean;
  
  // Post-reflection data (optional)
  postSatisfaction?: number;
  postConfidence?: number;
  postEffort?: number;
  postEnjoyment?: number;
  postAnxiety?: number;
  // Deprecated fields (no longer collected, but kept for backward compatibility)
  postDifficulty?: number;
  postDisappointment?: number;
  
  // User context
  userId: number;
  
  // Goal context (for goal-aware feedback)
  activeGoalTitles?: string[];
}

export interface FeedbackPattern {
   pattern: 'not_using_hints' | 'hint_dependent' | 'perfectionist' | 'overconfident' | 'impostor_syndrome' | 'burnout_fatigue' | 'flow_state' | 'frustrated_learner' | 'anxious_high_achiever' | 'high_performance' | 'struggling' | 'consistent_improvement' | 'mixed_performance' | 'building_confidence' | 'generic';
  confidence: number; // 0-1 how confident we are in this pattern
}

// ✅ Removed hardcoded goal lists - GoalsController is now the single source of truth
// The backend GoalsController handles all goal recommendation logic

/**
 * Detects the user's performance pattern based on session and reflection data
 * Priority order: struggling → high_performance → consistent_improvement → mixed_performance → building_confidence → generic
 */
export function detectPerformancePattern(data: AdaptiveFeedbackData): FeedbackPattern {
  const progress = getExerciseProgress(data.userId);
  
  console.log('🎯 ADAPTIVE FEEDBACK - Pattern Detection Input:', {
    hints: data.hints,
    errors: data.errors,
    postConfidence: data.postConfidence,
    postSatisfaction: data.postSatisfaction,
    postAnxiety: data.postAnxiety,
    method: data.method
  });

    // ✅ NEW PRIORITY 1: Not Using Hints Pattern (high errors but refusing help)
  if (data.hints === 0 && data.errors >= 3) {
    console.log('🎯 DETECTED PATTERN: NOT_USING_HINTS (struggling alone without using help)');
    return { pattern: 'not_using_hints', confidence: 0.85 };
  }
  
  // ✅ NEW PRIORITY 2: Hint Dependent Pattern (over-relying on hints for perfect score)
  if (data.hints >= 3 && data.errors === 0) {
    console.log('🎯 DETECTED PATTERN: HINT_DEPENDENT (using many hints to avoid errors)');
    return { pattern: 'hint_dependent', confidence: 0.85 };
  }
  // ✅ PRIORITY 3: Perfectionist Pattern (perfect performance but high stress)
  if (data.hints === 0 && data.errors === 0) {
    const highAnxiety = data.postAnxiety !== undefined ? data.postAnxiety >= 4 : false;
    const lowSatisfaction = data.postSatisfaction !== undefined ? data.postSatisfaction <= 2 : false;
    
    if (highAnxiety || lowSatisfaction) {
      console.log('🎯 DETECTED PATTERN: PERFECTIONIST (high stress with good performance)');
      return { pattern: 'perfectionist', confidence: 0.85 };
    }
  }
  
  // ✅ NEW PRIORITY 2: Overconfident Pattern (poor performance but high confidence)
  if (data.hints >= 3 || data.errors >= 3) {
    const highConfidence = data.postConfidence !== undefined ? data.postConfidence >= 4 : false;
    const lowAnxiety = data.postAnxiety !== undefined ? data.postAnxiety <= 2 : false;
    
    if (highConfidence && lowAnxiety) {
      console.log('🎯 DETECTED PATTERN: OVERCONFIDENT (poor performance but high confidence)');
      return { pattern: 'overconfident', confidence: 0.8 };
    }
  }
  
  // ✅ NEW PRIORITY 3: Impostor Syndrome Pattern (good performance but very low confidence)
  if (data.hints <= 2 && data.errors <= 1) {
    const veryLowConfidence = data.postConfidence !== undefined ? data.postConfidence <= 2 : false;
    
    if (veryLowConfidence) {
      console.log('🎯 DETECTED PATTERN: IMPOSTOR_SYNDROME (good performance but low confidence)');
      return { pattern: 'impostor_syndrome', confidence: 0.8 };
    }
  }
  
  // ✅ NEW PRIORITY 4: Burnout/Fatigue Pattern (declining performance + exhaustion signals)
  if (progress.total >= 3) {
    const lowSatisfaction = data.postSatisfaction !== undefined ? data.postSatisfaction <= 2 : false;
    const highAnxiety = data.postAnxiety !== undefined ? data.postAnxiety >= 4 : false; // Use anxiety instead of disappointment
    const moderateToHighEffort = data.postEffort !== undefined ? data.postEffort >= 3 : false;
    
    if (lowSatisfaction && highAnxiety && moderateToHighEffort) {
      console.log('🎯 DETECTED PATTERN: BURNOUT_FATIGUE (exhaustion signals)');
      return { pattern: 'burnout_fatigue', confidence: 0.75 };
    }
  }
  
  // ✅ NEW PRIORITY 5: Flow State Pattern (optimal learning zone)
  if (data.hints <= 2 && data.errors <= 2) {
    const highSatisfaction = data.postSatisfaction !== undefined ? data.postSatisfaction >= 4 : false;
    const lowAnxiety = data.postAnxiety !== undefined ? data.postAnxiety <= 2 : false;
    const highEnjoyment = data.postEnjoyment !== undefined ? data.postEnjoyment >= 4 : false;
    
    if (highSatisfaction && lowAnxiety && highEnjoyment) {
      console.log('🎯 DETECTED PATTERN: FLOW_STATE (optimal learning zone)');
      return { pattern: 'flow_state', confidence: 0.9 };
    }
  }
  
  // ✅ NEW PRIORITY 6: Frustrated Learner Pattern (high effort but disappointing results)
  if (data.hints >= 2 || data.errors >= 2) {
    const highEffort = data.postEffort !== undefined ? data.postEffort >= 4 : false;
    const lowSatisfaction = data.postSatisfaction !== undefined ? data.postSatisfaction <= 2 : false;
    const lowConfidence = data.postConfidence !== undefined ? data.postConfidence <= 2 : false; // Use confidence instead of disappointment
    
    if (highEffort && (lowSatisfaction || lowConfidence)) {
      console.log('🎯 DETECTED PATTERN: FRUSTRATED_LEARNER (high effort but disappointing results)');
      return { pattern: 'frustrated_learner', confidence: 0.75 };
    }
  }
  
  // ✅ NEW PRIORITY 7: Anxious High-Achiever Pattern (good performance but emotional cost)
  if (data.hints <= 2 && data.errors <= 1) {
    const highAnxiety = data.postAnxiety !== undefined ? data.postAnxiety >= 4 : false;
    const highEffort = data.postEffort !== undefined ? data.postEffort >= 4 : false;
    const lowEnjoyment = data.postEnjoyment !== undefined ? data.postEnjoyment <= 2 : false;
    
    if (highAnxiety && (highEffort || lowEnjoyment)) {
      console.log('🎯 DETECTED PATTERN: ANXIOUS_HIGH_ACHIEVER (good performance at emotional cost)');
      return { pattern: 'anxious_high_achiever', confidence: 0.8 };
    }
  }
  
  // ✅ EXISTING PRIORITY 8: Struggling Pattern (highest priority for support)
  const strugglingCondition = data.hints >= 3 || data.errors >= 3;
  console.log('🎯 Struggling condition check:', { 
    hints: data.hints, 
    errors: data.errors, 
    strugglingCondition: strugglingCondition,
    hintsCheck: data.hints >= 3,
    errorsCheck: data.errors >= 3
  });
  
  if (strugglingCondition) {
    const lowConfidence = data.postConfidence !== undefined ? data.postConfidence <= 2 : false;
    const lowSatisfaction = data.postSatisfaction !== undefined ? data.postSatisfaction <= 2 : false;
    const highAnxiety = data.postAnxiety !== undefined ? data.postAnxiety >= 4 : false;
    
    console.log('🎯 Emotional indicators:', {
      lowConfidence, lowSatisfaction, highAnxiety,
      postConfidence: data.postConfidence,
      postSatisfaction: data.postSatisfaction,
      postAnxiety: data.postAnxiety
    });
    
    if ((lowConfidence || lowSatisfaction || highAnxiety) && (data.hints >= 4 || data.errors >= 4)) {
      console.log('🎯 DETECTED PATTERN: STRUGGLING (high confidence - 0.9)');
      return { pattern: 'struggling', confidence: 0.9 };
    } else if (data.hints >= 3 || data.errors >= 3) {
      console.log('🎯 DETECTED PATTERN: STRUGGLING (medium confidence - 0.7)');
      return { pattern: 'struggling', confidence: 0.7 };
    }
  }
  
  // ✅ PRIORITY 2: High Performance Pattern
  const highPerformanceCondition = data.hints <= 1 && data.errors <= 1;
  console.log('🎯 High performance condition check:', { 
    hints: data.hints, 
    errors: data.errors, 
    highPerformanceCondition: highPerformanceCondition,
    hintsCheck: data.hints <= 1,
    errorsCheck: data.errors <= 1
  });
  
  if (highPerformanceCondition) {
    const hasReflectionData = data.postConfidence !== undefined && data.postSatisfaction !== undefined;
    
    if (hasReflectionData) {
      const highConfidence = data.postConfidence! >= 4;
      const highSatisfaction = data.postSatisfaction! >= 4;
      
      console.log('🎯 High performance emotional check:', {
        highConfidence, highSatisfaction,
        postConfidence: data.postConfidence,
        postSatisfaction: data.postSatisfaction
      });
      
      if (highConfidence && highSatisfaction) {
        console.log('🎯 DETECTED PATTERN: HIGH_PERFORMANCE (0.9 confidence)');
        return { pattern: 'high_performance', confidence: 0.9 };
      }
    } else {
      console.log('🎯 No reflection data for high performance pattern');
    }
    
    // Perfect technical performance regardless of reflection data
    if (data.hints === 0 && data.errors === 0) {
      return { pattern: 'high_performance', confidence: 0.8 };
    }
    
    // Good technical performance with some reflection data
    if (hasReflectionData && (data.postConfidence! >= 4 || data.postSatisfaction! >= 4)) {
      return { pattern: 'high_performance', confidence: 0.7 };
    }
  }
  
  // ✅ PRIORITY 3: Consistent Improvement Pattern
  if (progress.errorHistory.length >= 3) {
    const recentErrors = progress.errorHistory.slice(-3);
    const olderErrors = progress.errorHistory.slice(0, -3);
    
    if (olderErrors.length >= 2) {
      const recentAvg = recentErrors.reduce((sum, err) => sum + err, 0) / recentErrors.length;
      const olderAvg = olderErrors.reduce((sum, err) => sum + err, 0) / olderErrors.length;
      
      if (recentAvg < olderAvg && progress.total >= 5) {
        return { pattern: 'consistent_improvement', confidence: 0.8 };
      }
    }
  }
  
  // ✅ PRIORITY 4: Mixed Performance (good technical, emotional struggles)
  if (data.hints <= 2 && data.errors <= 2) {
    const lowSatisfaction = data.postSatisfaction !== undefined ? data.postSatisfaction <= 2 : false;
    const highAnxiety = data.postAnxiety !== undefined ? data.postAnxiety >= 4 : false;
    
    if (lowSatisfaction || highAnxiety) {
      return { pattern: 'mixed_performance', confidence: 0.7 };
    }
  }
  
  // ✅ PRIORITY 5: Building Confidence Pattern  
  if (data.hints <= 2 && data.errors <= 2 && progress.total >= 2) {
    const goodConfidence = data.postConfidence !== undefined ? data.postConfidence >= 3 : true; // Default to true if no data
    
    if (goodConfidence) {
      return { pattern: 'building_confidence', confidence: 0.6 };
    }
  }
  
  // ✅ FALLBACK: Generic Pattern
  return { pattern: 'generic', confidence: 0.3 };
}

/**
 * Goal-aware feedback prefix - overrides contradictory feedback for specific goal achievements
 */
function getGoalAwarePrefix(data: AdaptiveFeedbackData): string | null {
  if (!data.activeGoalTitles || data.activeGoalTitles.length === 0) {
    return null; // No active goals, use normal feedback
  }

  // Handle hint-free goal achievements
  if (data.hints === 0) {
    if (data.activeGoalTitles.includes("Complete exercises without hints")) {
      return "🎯 Perfect! You achieved your goal of completing without hints! ";
    }
    if (data.activeGoalTitles.includes("Work independently")) {
      return "💪 Great independence! You're working without hints as your goal requires! ";
    }
    if (data.activeGoalTitles.includes("Show exceptional problem-solving") && data.errors === 0) {
      return "✨ Flawless! You achieved exceptional problem-solving with 0 hints AND 0 errors! ";
    }
    if (data.activeGoalTitles.includes("Show exceptional problem-solving")) {
      return "🏆 Excellent hint-free completion! You're halfway to exceptional problem-solving! ";
    }
  }

  // Handle accuracy goal achievements  
  if (data.errors <= 1 && data.activeGoalTitles.includes("Solve problems with minimal errors")) {
    return "⭐ Excellent accuracy! You kept errors minimal as your goal was targeted! ";
  }

  return null; // Use normal feedback
}

/**
 * Generates adaptive motivational feedback message
 */
export function generateAdaptiveFeedback(data: AdaptiveFeedbackData): string {
  // Check for goal-aware feedback first
  const goalPrefix = getGoalAwarePrefix(data);
  if (goalPrefix) {
    console.log(`🎯 Goal-aware feedback triggered: ${goalPrefix}`);
    return goalPrefix + "Keep up the excellent work toward your learning objectives! 🌟";
  }

  const pattern = detectPerformancePattern(data);
  const progress = getExerciseProgress(data.userId);
  
  console.log(`🎯 ===== ADAPTIVE FEEDBACK DEBUG =====`);
  console.log(`🎯 Pattern Detected: ${pattern.pattern} (confidence: ${pattern.confidence})`);
  console.log(`🎯 Session Stats: hints=${data.hints}, errors=${data.errors}`);
  console.log(`🎯 Post-Reflection Data:`, {
    satisfaction: data.postSatisfaction,
    confidence: data.postConfidence,
    effort: data.postEffort,
    enjoyment: data.postEnjoyment,
    anxiety: data.postAnxiety
  });
  console.log(`🎯 ====================================`);
  
  switch (pattern.pattern) {
    case 'perfectionist':
      return generatePerfectionistFeedback(data);
      
    case 'overconfident':
      return generateOverconfidentFeedback(data);
      
    case 'impostor_syndrome':
      return generateImpostorSyndromeFeedback(data);
      
    case 'burnout_fatigue':
      return generateBurnoutFatigueFeedback(data);
      
    case 'flow_state':
      return generateFlowStateFeedback(data);
      
    case 'frustrated_learner':
      return generateFrustratedLearnerFeedback(data);
      
    case 'anxious_high_achiever':
      return generateAnxiousHighAchieverFeedback(data);
    
    case 'high_performance':
      return generateHighPerformanceFeedback(data);
      
    case 'struggling':
      return generateStrugglingFeedback(data);
      
    case 'consistent_improvement':
      return generateImprovementFeedback(data, progress);
      
    case 'mixed_performance':
      return generateMixedPerformanceFeedback(data);
      
    case 'building_confidence':
      return generateConfidenceBuildingFeedback(data);
    
    case 'not_using_hints':
      return generateNotUsingHintsFeedback(data);
      
    case 'hint_dependent':
      return generateHintDependentFeedback(data);
      
    default:
      return generateGenericFeedback(data);
  }
}

function generateHighPerformanceFeedback(data: AdaptiveFeedbackData): string {
  const perfectScore = data.hints === 0 && data.errors === 0;
  
  if (perfectScore) {
    return `🚀 Outstanding! Perfect execution with 0 hints and 0 errors! Your confidence is clearly high - you're ready for bigger challenges. I've updated your recommended goals to match your excellent progress!`;
  } else {
    return `🌟 Excellent work! Only ${data.hints} hints and ${data.errors} errors shows real mastery. With your high confidence level, you're ready for more advanced goals. I've updated your recommended goals to push you further!`;
  }
}

function generateStrugglingFeedback(data: AdaptiveFeedbackData): string {
  if (data.postAnxiety && data.postAnxiety >= 4) {
    return `💪 I see you’re feeling anxious, but you pushed through ${data.errors} errors and ${data.hints} hints- that takes real courage! I’ve adjusted your goal recommendations to give you more support and build confidence step by step. You’ve got this!🤗`;
  } else {
    return `🎯 Working through ${data.errors} errors and using ${data.hints} hints shows determination! Everyone learns at their own pace. I've updated your goals to better support your learning journey. You’ve got this!🤗`;
  }
}

function generateImprovementFeedback(_data: AdaptiveFeedbackData, progress: any): string {
  const recentErrors = progress.errorHistory.slice(-3);
  const olderErrors = progress.errorHistory.slice(0, -3);
  const recentAvg = recentErrors.reduce((sum: number, err: number) => sum + err, 0) / recentErrors.length;
  const olderAvg = olderErrors.reduce((sum: number, err: number) => sum + err, 0) / olderErrors.length;
  const improvementPercent = Math.round(((olderAvg - recentAvg) / olderAvg) * 100);
  
  return `📈 Amazing progress! Your error rate improved by ${improvementPercent}% from ${olderAvg.toFixed(1)} to ${recentAvg.toFixed(1)} - you're clearly learning and growing! I've updated your goals to celebrate and continue your improvement streak!`;
}

function generateMixedPerformanceFeedback(data: AdaptiveFeedbackData): string {
  if (data.postSatisfaction && data.postSatisfaction <= 2) {
    return `🎯 You're doing well (${data.hints} hints, ${data.errors} errors), but I sense some frustration. That's completely normal! I've adjusted your goals to help you feel more successful. Remember, progress isn't always linear! 💙`;
  } else {
    return `🌱 Good performance (${data.hints} hints, ${data.errors} errors) but I want you to feel more confident too! I've updated your goals to support both achievement and confidence.`;
  }
}

function generateConfidenceBuildingFeedback(data: AdaptiveFeedbackData): string {
  return `🌟 Great work! ${data.hints} hints and ${data.errors} errors shows you're building solid skills. Your confidence is growing nicely - that's the foundation of all great learning! I've updated your goals to keep building on this positive momentum! Keep going!💙`;
}

function generatePerfectionistFeedback(data: AdaptiveFeedbackData): string {
  return `🌟 Great job! You used no hints and made no errors! I notice you might still feel a bit stressed. Remember, learning doesn’t have to be perfect every time. Let’s set goals that celebrate your progress and keep things light. You’re doing awesome!💙`;
}

function generateOverconfidentFeedback(data: AdaptiveFeedbackData): string {
  return `💪 I love your confidence! You used ${data.hints} hints and made ${data.errors} errors, which just means more chances to learn and grow. I’ve set goals that will challenge you while building on your positive mindset. Your enthusiasm is your superpower! 🚀`;
}

function generateImpostorSyndromeFeedback(data: AdaptiveFeedbackData): string {
  return `🏆 Look at the data : only ${data.hints} hints and ${data.errors} errors - that’s truly impressive! Your skills are real,even if you sometimes doubt them. It’s normal to feel that way when you’re growing. I’ve selected goals to help you recognize and trust your abilities and see your progress.You’re more capable than you think!✨
`;
}

function generateBurnoutFatigueFeedback(_data: AdaptiveFeedbackData): string {
  return `🌿 I can sense you're putting in serious effort but feeling drained. That takes courage to keep going! Learning fatigue is real, and it's okay to adjust your pace. I've suggested lighter goals that will help you rebuild your enthusiasm while still making progress. Your wellbeing matters as much as your achievement! 💚`;
}

function generateFlowStateFeedback(data: AdaptiveFeedbackData): string {
  return `✨ You're in the learning zone! Great performance (${data.hints} hints, ${data.errors} errors) plus you're clearly enjoying the process. This is what optimal learning looks like! I've chosen goals that will help you maintain this wonderful momentum and positive experience. This is the magic of engaged learning! 🌟`;
}

function generateFrustratedLearnerFeedback(data: AdaptiveFeedbackData): string {
  return `🤝 I see you’re putting in real effort (${data.hints} hints, ${data.errors} errors) but feeling frustrated with the results. That’s completely normal. Your hard work isn’t wasted- sometimes learning often happens beneath the surface. I’ve adjusted your goals to help you see your progress more clearly. Your persistence will pay off!🌱`;
}

function generateAnxiousHighAchieverFeedback(data: AdaptiveFeedbackData): string {
  return `🧘‍♀️ Strong performance (${data.hints} hints, ${data.errors} errors) but I want you to feel as good as your results look! High achievement shouldn't come with high anxiety. You're clearly capable - now let's work on making it feel sustainable and enjoyable. I've selected goals that maintain your high standards while supporting your emotional wellbeing. Excellence and peace can coexist! 🌺`;
}

function generateGenericFeedback(data: AdaptiveFeedbackData): string {
  return `🎯 Nice work! You used ${data.hints} hints and made ${data.errors} errors - every attempt helps you learn! I've updated your recommended goals based on your progress.`;
}


function generateNotUsingHintsFeedback(data: AdaptiveFeedbackData): string {
  return `💡 I notice you made ${data.errors} errors without using any hints. That shows determination, but remember - hints are here to help you learn, not to make things easier! Using hints strategically can help you build understanding and confidence faster. I've updated your goals, and I encourage you to try using the hint system - it's a powerful learning tool! 🎓`;
}

function generateHintDependentFeedback(data: AdaptiveFeedbackData): string {
  return `🎯 Great job getting a perfect score, but I noticed you used ${data.hints} hints to get there. Hints are helpful for learning, but try challenging yourself to use fewer hints next time - it will help you build independent problem-solving skills and confidence! I've updated your goals to help you gradually reduce hint dependency while maintaining your success. You're capable of more than you think! 💪`;
}

/**
 * Main function to generate adaptive feedback for goal completion
 * This integrates with the existing goal completion flow
 */
export function getAdaptiveGoalCompletionMessage(
  userId: number,
  sessionData: ExerciseSession,
  postReflectionData?: {
    postSatisfaction?: number;
    postConfidence?: number;
    postEffort?: number;
    postEnjoyment?: number;
    postAnxiety?: number;
    // Deprecated fields (no longer collected)
    postDifficulty?: number;
    postDisappointment?: number;
  }
): string {
  
  const feedbackData: AdaptiveFeedbackData = {
    hints: sessionData.hints,
    errors: sessionData.errors,
    method: sessionData.method,
    exerciseType: sessionData.exerciseType,
    completedWithSelfExplanation: sessionData.completedWithSelfExplanation,
    userId: userId,
    ...postReflectionData
  };
  
  return generateAdaptiveFeedback(feedbackData);
}