// Adaptive Motivational Feedback System
// Generates specific, stats-based motivational messages for the pedagogical agent
// 
// ✅ ARCHITECTURE: Single Source of Truth
// - GoalsController (Backend) = Primary source for goal recommendations
// - AdaptiveFeedback (Frontend) = Focus on motivational messaging only
// - No duplicate goal suggestion logic = Consistent recommendations across system

import i18n from '@/i18n';
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

// Helper function to get translation function  
const t = (key: string, options?: any): string => {
  return i18n.t(key, { ns: 'goalsetting', ...options }) as string;
};

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
      return t('adaptive-feedback.goal-aware.hints-free-goal');
    }
    if (data.activeGoalTitles.includes("Work independently")) {
      return t('adaptive-feedback.goal-aware.work-independently');
    }
    if (data.activeGoalTitles.includes("Show exceptional problem-solving") && data.errors === 0) {
      return t('adaptive-feedback.goal-aware.exceptional-flawless');
    }
    if (data.activeGoalTitles.includes("Show exceptional problem-solving")) {
      return t('adaptive-feedback.goal-aware.exceptional-halfway');
    }
  }

  // Handle accuracy goal achievements  
  if (data.errors <= 1 && data.activeGoalTitles.includes("Solve problems with minimal errors")) {
    return t('adaptive-feedback.goal-aware.minimal-errors');
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
    return goalPrefix + t('adaptive-feedback.goal-aware.keep-up');
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
    return t('adaptive-feedback.high-performance.perfect');
  } else {
    return t('adaptive-feedback.high-performance.excellent', { hints: data.hints, errors: data.errors });
  }
}

function generateStrugglingFeedback(data: AdaptiveFeedbackData): string {
  if (data.postAnxiety && data.postAnxiety >= 4) {
    return t('adaptive-feedback.struggling.with-anxiety', { errors: data.errors, hints: data.hints });
  } else {
    return t('adaptive-feedback.struggling.default', { errors: data.errors, hints: data.hints });
  }
}

function generateImprovementFeedback(_data: AdaptiveFeedbackData, progress: any): string {
  const recentErrors = progress.errorHistory.slice(-3);
  const olderErrors = progress.errorHistory.slice(0, -3);
  const recentAvg = recentErrors.reduce((sum: number, err: number) => sum + err, 0) / recentErrors.length;
  const olderAvg = olderErrors.reduce((sum: number, err: number) => sum + err, 0) / olderErrors.length;
  const improvementPercent = Math.round(((olderAvg - recentAvg) / olderAvg) * 100);
  
  return t('adaptive-feedback.consistent-improvement.message', { 
    improvementPercent, 
    olderAvg: olderAvg.toFixed(1), 
    recentAvg: recentAvg.toFixed(1) 
  });
}

function generateMixedPerformanceFeedback(data: AdaptiveFeedbackData): string {
  if (data.postSatisfaction && data.postSatisfaction <= 2) {
    return t('adaptive-feedback.mixed-performance.frustrated', { hints: data.hints, errors: data.errors });
  } else {
    return t('adaptive-feedback.mixed-performance.default', { hints: data.hints, errors: data.errors });
  }
}

function generateConfidenceBuildingFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.building-confidence.message', { hints: data.hints, errors: data.errors });
}

function generatePerfectionistFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.perfectionist.message');
}

function generateOverconfidentFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.overconfident.message', { hints: data.hints, errors: data.errors });
}

function generateImpostorSyndromeFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.impostor-syndrome.message', { hints: data.hints, errors: data.errors });
}

function generateBurnoutFatigueFeedback(_data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.burnout-fatigue.message');
}

function generateFlowStateFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.flow-state.message', { hints: data.hints, errors: data.errors });
}

function generateFrustratedLearnerFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.frustrated-learner.message', { hints: data.hints, errors: data.errors });
}

function generateAnxiousHighAchieverFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.anxious-high-achiever.message', { hints: data.hints, errors: data.errors });
}

function generateGenericFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.generic.message', { hints: data.hints, errors: data.errors });
}


function generateNotUsingHintsFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.not-using-hints.message', { errors: data.errors });
}

function generateHintDependentFeedback(data: AdaptiveFeedbackData): string {
  return t('adaptive-feedback.hint-dependent.message', { hints: data.hints });
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