// src/components/GoalList.tsx

import { useState, useEffect } from "react";
import { flushSync } from "react-dom";
import { Goal, GoalInput } from "@/types/goal";

import {
  updateGoal,
  deleteGoal,
  // markGoalAsDone, // COMMENTED OUT: Removed Mark as Done functionality per professor feedback
  logReason,
  completeGoalWithScore,
  updateGoalSuggestions,
} from "@/utils/api";
import { generateAdaptiveFeedback } from "../../utils/adaptiveFeedback";

import AgentPopup from "../PedologicalAgent";
import FemaleAfricanSmiling from "@images/flexibility/AfroAmerican_F_Smiling.png";

import ReasonPrompt from "../ReasonPrompt";
import confetti from "canvas-confetti";
import { useAutoGoalCompletion } from "@/hooks/useAutoGoalCompletion";
import { GoalCompletionProvider } from "@/contexts/GoalCompletionContext";

import RetrospectiveModal from "../RetrospectivePrompt";
import DiscrepancyFeedbackModal from "../DiscrepencyFeedbackModel";

interface Props {
  goals: Goal[];
  onGoalsChange: (goals: Goal[]) => void;
  userId: number;
  showOnlyActive?: boolean;
  showOnlyCompleted?: boolean;
  compact?: boolean; // For overlay/compact display mode
}
import PostTaskAppraisal from "../PostTaskAppraisal";

// Goal completion guidance mapping
const goalCompletionGuide: Record<string, string> = {
  // Basic Understanding (5 goals)
  "Learn what linear equations are": "🎯 How to Complete:\n• Start any Flexibility Exercise (Suitability, Efficiency, or Matching)\n• This goal completes automatically when you first access linear equation content\n\n📚 Completes on first exercise access!",
  
  "Understand how substitution works": "🔄 How to Complete:\n• Complete 1 exercise using the Substitution method\n• Choose substitution in any Flexibility Exercise\n• Successfully solve the problem\n\n📚 Specific Exercises for Substitution:\n• Exercise #2 (Efficiency) - Substitution focus\n• Exercise #9 (Matching) - Substitution practice\n• Any Suitability exercise - Choose substitution when appropriate\n\n💡 Completes after your first successful substitution exercise!",
  
  "Understand how elimination works": "⚖️ How to Complete:\n• Complete 1 exercise using the Elimination method\n• Choose elimination in any Flexibility Exercise\n• Successfully solve the problem\n\n📚 Specific Exercises for Elimination:\n• Exercise #6 (Efficiency) - Elimination focus\n• Exercise #7 (Matching) - Elimination practice\n• Exercise #11 (Efficiency) - More elimination practice\n• Any Suitability exercise - Choose elimination when appropriate\n\n💡 Completes after your first successful elimination exercise!",
  
  "Understand how equalization works": "⚖️ How to Complete:\n• Complete 1 exercise using the Equalization method\n• Choose equalization in any Flexibility Exercise\n• Successfully solve the problem\n\n📚 Specific Exercises for Equalization:\n• Exercise #2 (Matching) - Equalization focus\n• Exercise #13 (Matching) - More equalization practice\n• Any Suitability exercise - Choose equalization when appropriate\n\n💡 Completes after your first successful equalization exercise!",
  
  "Master all three methods fluently": "🏆 How to Complete:\n• Complete 2+ exercises with each method (substitution, elimination, equalization)\n• Demonstrates comprehensive method mastery\n• Shows fluency across all solving approaches\n\n📚 Method-Specific Exercises:\n• Substitution: Efficiency #2, Matching #9\n• Elimination: Efficiency #6&#11, Matching #7\n• Equalization: Matching #2&#13\n• All Methods: Any Suitability exercise\n\n🏅 Completes when you've mastered all three methods individually!",

  // Method Mastery (5 goals)
  "Master substitution/equalization/elimination method": "🏆 How to Complete:\n• Complete 2 exercises either using Substitution/Equalization/Elimination method\n• Shows growing competence with substitution\n• Can be any combination of exercise types\n\n⭐ Completes after your second substitution exercise success!",
  
  "Practice with different methods": "🔄 How to Complete:\n• Use 2 different methods across any exercises\n• For example: 1 substitution exercise + 1 elimination exercise\n• Shows willingness to explore different approaches\n\n🎲 Completes when you've tried 2 different methods!",
  
  "Switch methods strategically": "🧠 How to Complete:\n• Complete 3 exercises using different methods each time\n• Demonstrates strategic method selection\n• Shows flexibility in problem-solving approach\n\n🎯 Completes after using 3 different methods across 3 exercises!",
  
  "Choose optimal methods consistently": "⚡ How to Complete:\n• Complete 3 Efficiency Exercises (where method choice matters most)\n• Focuses on optimal method selection\n• Shows consistent strategic thinking\n\n🚀 Completes after 3 successful Efficiency Exercise completions!",

  // Problem Solving (5 goals)
  "Complete exercises without hints": "🎖️ How to Complete:\n• Complete 1 exercise using 0 hints\n• Demonstrates full independence on that exercise\n• Shows confidence in your abilities\n\n💪 Completes when you finish an exercise without any hints!",
  
  "Solve problems with minimal errors": "⭐ How to Complete:\n• Complete 1 exercise with ≤1 error\n• Shows accuracy and careful problem-solving\n• Focus on precision over speed\n\n🎯 Completes when you make 1 or fewer errors in an exercise!",
  
  "Handle complex problems confidently": "🌟 How to Complete:\n• Complete 5 total exercises (any type/method)\n• Shows sustained engagement and practice\n• Builds confidence through experience\n\n📈 Completes after your 5th total exercise completion!",
  
  "Show exceptional problem-solving": "🏅 How to Complete:\n• Complete 1 exercise with 0 errors AND 0 hints\n• Demonstrates exceptional skill and independence\n• The perfect exercise completion\n\n✨ Completes when you achieve a flawless exercise (no errors, no hints)!",
  
  "Maintain accuracy under pressure": "💎 How to Complete:\n• Complete 5+ exercises with average ≤1 error across all exercises\n• Shows consistent accuracy over time\n• Demonstrates skill under sustained challenge\n\n🎯 Completes when your overall error average ≤1.0 across 5+ exercises!",

  // Learning & Growth (5 goals)  
  "Reflect on method effectiveness": "🤔 How to Complete:\n• Complete an exercise with self-explanation in Matching Exercise or Efficiency Exercise\n• Provide thoughtful reasoning about method choices\n• Shows deeper analytical thinking\n\n📖 Completes when you engage with self-explanation features!",
  
  "Learn from mistakes effectively": "📈 How to Complete:\n• Complete exercises where recent performance shows fewer errors than earlier attempts\n• Demonstrates improvement over time through learning\n• Shows growth mindset in action\n\n📊 Completes when error tracking shows clear improvement trend!",
  
  "Explain reasoning clearly": "🗣️ How to Complete:\n• Complete 3 exercises with self-explanation components\n• Consistently engage with reasoning prompts\n• Shows strong metacognitive skills\n\n🧠 Completes after 3 successful self-explanation exercises!",
  
  "Show consistent improvement": "📈 How to Complete:\n• Complete 4 exercises with decreasing error rates over time\n• Demonstrates sustained learning and improvement\n• Shows mastery through consistent progress\n\n🎯 Completes when error data shows consistent improvement trend!",
  
  "Work independently": "👑 How to Complete:\n• Complete 3 exercises with 0 hints each\n• Shows consistent independent problem-solving\n• Demonstrates true mastery and confidence\n\n🏆 The ultimate independence achievement - 3 hint-free exercises!",
  
  "Build confidence through success": "💪 How to Complete:\n• Complete 1 exercise using 2 or fewer hints\n• Shows growing independence\n• Focus on working with less assistance\n\n⭐ Completes when hint usage is 2 or less in an exercise!",
  
  "Develop problem-solving resilience": "🌱 How to Complete:\n• Complete 1 exercise after making at least 1 error\n• Shows ability to recover and persist through mistakes\n• Demonstrates growth mindset and resilience\n\n💪 Completes when you successfully finish an exercise despite making errors!",
  
  "Set personal learning challenges": "🎯 How to Complete:\n• Complete 10 total exercises (any type/method)\n• Shows commitment to sustained learning\n• Demonstrates self-directed challenge-seeking\n\n🏆 Completes after your 10th total exercise completion!",
  
  "Track progress meaningfully": "🌟 How to Complete:\n• Complete exercises using all 3 different methods (substitution, elimination, equalization)\n• Shows comprehensive engagement with all approaches\n• Demonstrates holistic learning approach\n\n🌟 Completes when you've successfully used all three methods!"
};



const categorizedGoals: Record<string, { title: string; difficulty: string }[]> = {
  "Basic Understanding": [
    { title: "Learn what linear equations are", difficulty: "very easy"},
    { title: "Understand how substitution works", difficulty: "very easy"},
    { title: "Understand how elimination works", difficulty: "very easy"},
    { title: "Understand how equalization works", difficulty: "very easy"},
  ],
  "Method Mastery": [
    { title: "Master substitution/equalization/elimination method", difficulty: "easy" },
    { title: "Practice with different methods", difficulty: "easy" },
    { title: "Switch methods strategically", difficulty: "medium" },
    { title: "Choose optimal methods consistently", difficulty: "hard" },
    { title: "Master all three methods fluently", difficulty: "very hard" },
  ],
  "Problem Solving": [
    { title: "Complete exercises without hints", difficulty: "easy" },
    { title: "Solve problems with minimal errors", difficulty: "medium" },
    { title: "Handle complex problems confidently", difficulty: "medium" },
    { title: "Show exceptional problem-solving", difficulty: "hard" },
    { title: "Maintain accuracy under pressure", difficulty: "very hard" },
  ],
  "Learning & Growth": [
    { title: "Reflect on method effectiveness", difficulty: "very easy" },
    { title: "Build confidence through success", difficulty: "easy" },
    { title: "Learn from mistakes effectively", difficulty: "easy" },
    { title: "Track progress meaningfully", difficulty: "medium" },
    { title: "Develop problem-solving resilience", difficulty: "medium" },
    { title: "Explain reasoning clearly", difficulty: "medium" },
    { title: "Show consistent improvement", difficulty: "hard" },
    { title: "Set personal learning challenges", difficulty: "hard" },
    { title: "Work independently", difficulty: "very hard" },
  ],
};


export function GoalList({ goals, onGoalsChange, userId, showOnlyActive, showOnlyCompleted, compact = false }: Props) {
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editCategory, setEditCategory] = useState<string>("");

const [showAppraisalModal, setShowAppraisalModal] = useState<{ goalId: number } | null>(null);
  const [reasonPrompt, setReasonPrompt] = useState<{
    goalId: number;
    action: string;
  } | null>(null);

  const [Completedcount, setCompletedCount] = useState(0);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const [feedbackData, setFeedbackData] = useState<{
    goalId: number;
    expected: number;
    perceived: number;
    actual: number;
  } | null>(null);
  const [showGuidanceModal, setShowGuidanceModal] = useState<string | null>(null);

  // Helper function to get difficulty display text
  const getDifficultyDisplay = (difficulty: string) => {
    const difficultyMap: Record<string, string> = {
      "very easy": "🟦 Very Easy",
      "easy": "😊 Easy", 
      "medium": "🙂 Medium",
      "hard": "😅 Hard",
      "very hard": "⚫ Very Hard"
    };
    return difficultyMap[difficulty] || "🙂 Medium";
  };

  const totalGoals = goals.length;
  const completedGoals = goals.filter((g) => g.completed).length;
  const activeGoals = goals.filter((g) => !g.completed).length;
  const progressPercent = totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0;

  // Filter goals based on props
  const filteredGoals = (() => {
    if (showOnlyActive) {
      return goals.filter(goal => !goal.completed);
    }
    if (showOnlyCompleted) {
      return goals.filter(goal => goal.completed);
    }
    return goals; // Show all goals if no filter specified
  })();
const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  // useEffect(() => {
  //   if (progressPercent === 100 && totalGoals > 0) {
  //     setAgentMessage("🎉 Awesome! You completed all your goals!");
  //     setShowCheckIn(true);

  //     confetti({
  //       particleCount: 150,
  //       spread: 70,
  //       origin: { y: 0.6 },
  //     });
  //   }
  // }, [progressPercent, totalGoals]);

  // State to store auto-calculated score and contributing exercises for retrospective modal
  const [autoCalculatedScore, setAutoCalculatedScore] = useState<number | null>(null);
  const [contributingExercises, setContributingExercises] = useState<any[] | null>(null);

  // Initialize the auto-completion hook with retrospective callback
  const { completeGoalByTitle } = useAutoGoalCompletion(
    goals,
    onGoalsChange,
    (goalId: number, autoScore?: number, exercises?: any[]) => {
      console.log(`🎯 Goal completion triggered with auto score: ${autoScore}, exercises:`, exercises);
      setSelectedGoalId(goalId);
      setAutoCalculatedScore(autoScore || null);
      setContributingExercises(exercises || null);
    }
  );

  // Listen for custom goal completion events from exercises
  useEffect(() => {
    const handleGoalCompletion = (event: CustomEvent) => {
      const { goalId, goalTitle } = event.detail;
      console.log(`🎯 GoalList received completion event for goal: "${goalTitle}" (ID: ${goalId})`);
      console.log(`🎯 Current completeGoalByTitle function:`, completeGoalByTitle);
      
      // Use the auto-scoring system instead of direct modal opening
      if (goalTitle) {
        console.log(`🚀 Using auto-scoring system for custom event: "${goalTitle}"`);
        completeGoalByTitle(goalTitle);
      } else {
        // Fallback to old method if no goalTitle provided
        console.log(`⚠️ No goalTitle provided, falling back to direct modal opening`);
        flushSync(() => {
          setSelectedGoalId(goalId);
        });
      }
    };

    console.log(`🎯 Setting up goal completion event listener - completeGoalByTitle:`, completeGoalByTitle);
    window.addEventListener('triggerGoalCompletion', handleGoalCompletion as EventListener);
    
    return () => {
      console.log(`🎯 Cleaning up goal completion event listener`);
      window.removeEventListener('triggerGoalCompletion', handleGoalCompletion as EventListener);
    };
  }, [completeGoalByTitle]); // Include completeGoalByTitle to ensure fresh closure

  // Debug: Monitor selectedGoalId changes
  useEffect(() => {
    console.log(`🎯 selectedGoalId changed to: ${selectedGoalId}`);
    if (selectedGoalId !== null) {
      console.log(`🎯 RetrospectiveModal should be open now with selectedGoalId: ${selectedGoalId}`);
      // Force a re-render to ensure modal appears
      setTimeout(() => {
        console.log(`🎯 Force checking modal state: selectedGoalId=${selectedGoalId}, isOpen=${selectedGoalId !== null}`);
      }, 50);
    }
  }, [selectedGoalId]);

  function startEditing(goal: Goal) {
    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditDifficulty(goal.difficulty);
    setEditCategory(goal.category || "");
  }

  function cancelEditing() {
    setEditingGoalId(null);
  }

  async function saveEdit() {
    if (editingGoalId === null) return;

    try {
      const updatedGoalInput: GoalInput = {
        title: editTitle,
        difficulty: editDifficulty,
        category: editCategory,
        userId: goals.find((g) => g.id === editingGoalId)?.userId || userId, // Use dynamic userId instead of hardcoded 1
      };

      await updateGoal(editingGoalId, updatedGoalInput);

      const newGoals = goals.map((g) =>
        g.id === editingGoalId
          ? { ...g, title: editTitle, difficulty: editDifficulty, category: editCategory }
          : g
      );

      onGoalsChange(newGoals);

      setEditingGoalId(null);
      setReasonPrompt({ goalId: editingGoalId, action: "Update" });
      setAgentMessage(
        "👍 Great! Changing goals is okay — just remember why you made the switch!"
      );
      setShowCheckIn(true);
    } catch (error) {
      console.error("Failed to update goal", error);
    }
  }

// COMMENTED OUT: Mark as Done functionality removed per professor feedback
/* 
async function handleMarkAsDone(id: number) {
  try {
    // First show the PostTaskAppraisal
    setShowAppraisalModal({ goalId: id });
    
    // The actual completion will happen after appraisal submission
    setSelectedGoalId(id);
    
  } catch (error) {
    console.error("Failed to mark goal as done", error);
    setAgentMessage("❌ Something went wrong. Please try again.");
    setShowCheckIn(true);
  }
}
*/

// Update handleSubmitRetrospective to show PostTaskAppraisal after
const handleSubmitRetrospective = async (actualScore: number) => {
  if (selectedGoalId) {
    // Store the actual score only
    setTempScores({ actualScore });
    
    // Show the PostTaskAppraisal next
    setShowAppraisalModal({ goalId: selectedGoalId });
    setSelectedGoalId(null);
  }
};

// Add state for temporary score storage
const [tempScores, setTempScores] = useState<{
  actualScore?: number;
} | null>(null);

// Update handleAppraisalSubmit to include the retrospective scores

async function handleAppraisalSubmit(
  postSatisfaction: number,
  postConfidence: number,
  postEffort: number,
  postEnjoyment: number,
  postAnxiety: number
) {
  try {
    if (!showAppraisalModal?.goalId || !tempScores) return;

    // Get the current goal
    const currentGoal = goals.find(g => g.id === showAppraisalModal.goalId);
    if (!currentGoal) return;

    // Get hints and errors from the exercise session if available
    let hintsUsed = undefined;
    let errorsMade = undefined;
    
    // Try to find the exercise session data for this goal completion
    const allSessionKeys = Object.keys(sessionStorage).filter(key => 
      key.startsWith(`exerciseSession_${userId}_`)
    );
    if (allSessionKeys.length > 0) {
      // Get the most recent session
      let mostRecentKey = allSessionKeys[0];
      let mostRecentTime = 0;
      
      for (const key of allSessionKeys) {
        const sessionData = sessionStorage.getItem(key);
        if (sessionData) {
          try {
            const session = JSON.parse(sessionData);
            if (session.completedAt && session.completedAt > mostRecentTime) {
              mostRecentKey = key;
              mostRecentTime = session.completedAt;
            }
          } catch (error) {
            // Skip invalid session data
          }
        }
      }
      
      const sessionData = sessionStorage.getItem(mostRecentKey);
      if (sessionData) {
        try {
          const session = JSON.parse(sessionData);
          hintsUsed = typeof session.hints === 'number' ? session.hints : undefined;
          errorsMade = typeof session.errors === 'number' ? session.errors : undefined;
          console.log('🎯 Retrieved hints and errors for goal completion:', { hintsUsed, errorsMade });
          
          // NOTE: Don't clear session data yet - we need it for adaptive feedback generation later
          // It will be cleared after adaptive feedback is generated
        } catch (error) {
          console.warn('🎯 Failed to parse session data for hints/errors');
        }
      }
    }
    
    // First make the API call and get the updated goal
    await completeGoalWithScore(
      showAppraisalModal.goalId,
      tempScores.actualScore,
      hintsUsed,
      errorsMade,
      postSatisfaction,
      postConfidence,
      postEffort,
      postEnjoyment,
      postAnxiety
    );

    // Then update local state with the response
    const newGoals = goals.map((g) => 
      g.id === showAppraisalModal.goalId ? { 
        ...g, 
        completed: true,
        actualScore: tempScores.actualScore,
        postSatisfaction,
        postConfidence,
        postEffort,
        postEnjoyment,
        postAnxiety
      } : g
    );
    onGoalsChange(newGoals);

    // Show discrepancy feedback if there's a significant gap between expected and actual mistakes
    
    const actualMistakes = tempScores.actualScore || 0;
    const expectedMistakes = currentGoal.expectedMistakes || 0;
    
    // Calculate discrepancy - how far off were they from their expected mistake count
    const mistakeGap = Math.abs(expectedMistakes - actualMistakes);
    
    // Show discrepancy feedback if there's a significant difference (>3 mistakes difference)
    if (mistakeGap > 3) {
      console.log(`🎯 Discrepancy detected - Expected: ${expectedMistakes} mistakes, Actual: ${actualMistakes} mistakes`);
      
      // Delay showing discrepancy feedback after other messages
      setTimeout(() => {
        setFeedbackData({
          goalId: showAppraisalModal.goalId,
          expected: expectedMistakes,
          perceived: 0, // No longer used
          actual: actualMistakes
        });
      }, 6000); // Show after other feedback messages
    }

    // Update dynamic goal suggestions based on new progress
    let updatedSuggestions: string[] = [];
    try {
      updatedSuggestions = await updateGoalSuggestions(userId);
      console.log('Updated goal suggestions:', updatedSuggestions);
      
      // Dispatch a custom event to notify the parent component about updated suggestions
      window.dispatchEvent(new CustomEvent('goalSuggestionsUpdated', { 
        detail: { suggestions: updatedSuggestions } 
      }));
    } catch (error) {
      console.error('Failed to update goal suggestions:', error);
    }

    // Prepare messages array
    const messages: string[] = [];
    
    // Add basic goal completion feedback
    messages.push(`🎉 Goal completed! Great work on "${currentGoal.title}".`);

    // Add progression feedback if suggestions were updated
    if (updatedSuggestions && updatedSuggestions.length > 0) {
      console.log('🎯 Goal suggestions updated - generating adaptive feedback');
      
      // ✅ NEW: Generate adaptive feedback here since this is where PostTaskAppraisal is actually handled
      try {
        // Use the userId that's already in scope (from earlier in the function)
        console.log('🎯 Using userId for adaptive feedback:', userId);
        
        // ✅ For multi-exercise goals, get averaged data from contributing exercises
        let averagedHints: number | undefined = undefined;
        let averagedErrors: number | undefined = undefined;
        
        // Import auto-scoring utilities
        const { getExerciseScores, getContributingExercises } = await import('@/utils/autoScoring');
        const allExerciseScores = getExerciseScores(userId);
        const contributingExercises = getContributingExercises(currentGoal.title, allExerciseScores);
        
        if (contributingExercises.length > 0) {
          console.log('🎯 Found', contributingExercises.length, 'contributing exercises for adaptive feedback');
          
          // Calculate average hints and errors across all contributing exercises
          const totalHints = contributingExercises.reduce((sum, ex) => sum + ex.hints, 0);
          const totalErrors = contributingExercises.reduce((sum, ex) => sum + ex.errors, 0);
          averagedHints = Math.round(totalHints / contributingExercises.length);
          averagedErrors = Math.round(totalErrors / contributingExercises.length);
          
          console.log('🎯 Averaged performance data:', {
            contributingCount: contributingExercises.length,
            totalHints,
            totalErrors,
            averagedHints,
            averagedErrors
          });
        }
        
        // We'll use sessionStorage directly to find exercise session data
        
        // Try to find exercise session data (checking common exercise types)
        let exerciseSession = null;
        
        // Get ALL session storage keys for debugging
        console.log('🎯 ALL sessionStorage keys:', Object.keys(sessionStorage));
        
        // For flexibility exercises, find the most recent session by timestamp
        const allSessionKeys = Object.keys(sessionStorage).filter(key => 
          key.startsWith(`exerciseSession_${userId}_`)
        );
        
        console.log('🎯 Session keys for userId', userId, ':', allSessionKeys);
        
        const sessionKeys = allSessionKeys.filter(key => 
          key.includes('efficiency') || key.includes('suitability') || key.includes('matching')
        );
        
        console.log('🎯 Filtered exercise session keys:', sessionKeys);
        
        let mostRecentKey = '';
        let mostRecentTimestamp = 0;
        
        if (sessionKeys.length > 0) {
          // Find the MOST RECENT session by timestamp
          console.log('🎯 Found', sessionKeys.length, 'exercise session keys');
          
          for (const key of sessionKeys) {
            const sessionData = sessionStorage.getItem(key);
            console.log('🎯 Checking session key:', key, 'data:', sessionData);
            if (sessionData) {
              try {
                const session = JSON.parse(sessionData);
                console.log('🎯 Parsed session:', session);
                // Check if session has valid hints/errors data
                if (session && typeof session.hints === 'number' && typeof session.errors === 'number') {
                  // ✅ Support both 'timestamp' (new) and 'completedAt' (old) for backward compatibility
                  const sessionTimestamp = session.timestamp || session.completedAt || 0;
                  console.log('🎯 Session timestamp:', sessionTimestamp, 'vs current mostRecent:', mostRecentTimestamp);
                  
                  // Use this session if it's more recent than what we have
                  if (sessionTimestamp > mostRecentTimestamp) {
                    mostRecentKey = key;
                    exerciseSession = session;
                    mostRecentTimestamp = sessionTimestamp;
                    console.log('🎯 ✅ New most recent session:', key, exerciseSession);
                  }
                } else {
                  console.log('🎯 ❌ Session missing hints/errors:', session);
                }
              } catch (error) {
                console.warn('🎯 Failed to parse session:', key, error);
              }
            } else {
              console.log('🎯 ❌ No data for key:', key);
            }
          }
          
          if (mostRecentKey) {
            console.log('🎯 ✅ Using most recent exercise session:', mostRecentKey, 'timestamp:', mostRecentTimestamp);
          } else {
            console.log('🎯 ❌ No valid sessions found with hints/errors');
          }
        } else {
          console.log('🎯 ❌ No exercise session keys found');
        }
        
        if (exerciseSession && mostRecentKey) {
          // Determine the actual exercise type from the session key
          const actualExerciseType = mostRecentKey.includes('suitability') ? 'suitability' : 
                                   mostRecentKey.includes('matching') ? 'matching' : 'efficiency';
          
          // Validate session data with strict type checking
          const hints = (typeof exerciseSession.hints === 'number' && !isNaN(exerciseSession.hints)) ? 
                       exerciseSession.hints : 0;
          const errors = (typeof exerciseSession.errors === 'number' && !isNaN(exerciseSession.errors)) ? 
                        exerciseSession.errors : 0;
          
          console.log('🎯 Validated session data - hints:', hints, 'errors:', errors, 'type:', actualExerciseType);
          
          // Extra validation: ensure non-negative values
          if (hints < 0 || errors < 0) {
            console.error('🎯 ❌ Invalid session data: negative values detected', { hints, errors });
            throw new Error('Invalid session data');
          }
          
          const sessionData = {
            hints: hints,
            errors: errors,
            method: exerciseSession.method || 'substitution',
            exerciseType: actualExerciseType,
            completedWithSelfExplanation: exerciseSession.completedWithSelfExplanation || false
          };
          
          const emotionalData = {
            postSatisfaction,
            postConfidence,
            postEffort,
            postEnjoyment,
            postAnxiety
          };
          
          console.log('🎯 Session data for adaptive feedback:', sessionData);
          console.log('🎯 Emotional data for adaptive feedback:', emotionalData);
          
          // ✅ Use averaged data for multi-exercise goals, or single session data for single-exercise goals
          const finalHints = averagedHints !== undefined ? averagedHints : sessionData.hints;
          const finalErrors = averagedErrors !== undefined ? averagedErrors : sessionData.errors;
          
          console.log('🎯 Final performance data for adaptive feedback:', {
            originalHints: sessionData.hints,
            originalErrors: sessionData.errors,
            averagedHints,
            averagedErrors,
            finalHints,
            finalErrors,
            isAveraged: averagedHints !== undefined
          });
          
          // Generate adaptive feedback message
          const feedbackData = {
            hints: finalHints,
            errors: finalErrors,
            method: sessionData.method,
            exerciseType: sessionData.exerciseType,
            completedWithSelfExplanation: sessionData.completedWithSelfExplanation,
            userId: userId,
            ...emotionalData
          };
          const adaptiveFeedbackMessage = generateAdaptiveFeedback(feedbackData);
          
          console.log('🎯 Generated adaptive feedback for goal completion');
          messages.push(adaptiveFeedbackMessage);
          
          // ✅ NOW clear the session data after using it for adaptive feedback
          if (mostRecentKey) {
            sessionStorage.removeItem(mostRecentKey);
            console.log('🧹 Cleared used session data after adaptive feedback:', mostRecentKey);
          }
        } else {
          // ✅ FIX: Generate adaptive feedback even without exercise session data
          // This handles auto-completed goals from study sessions that don't have exercise session data
          console.log('🎯 No exercise session found, generating adaptive feedback from reflection data only');
          
          const emotionalData = {
            postSatisfaction,
            postConfidence,
            postEffort,
            postEnjoyment,
            postAnxiety
          };
          
          // Use default values for technical performance (no exercise data available)
          const feedbackData = {
            hints: 0,  // Default: assume no hints needed if no session data
            errors: 0,  // Default: assume no errors if no session data
            method: 'substitution',
            exerciseType: 'efficiency',
            completedWithSelfExplanation: false,
            userId: userId,
            ...emotionalData
          };
          
          console.log('🎯 Generating adaptive feedback from reflection data:', emotionalData);
          const adaptiveFeedbackMessage = generateAdaptiveFeedback(feedbackData);
          messages.push(adaptiveFeedbackMessage);
        }
      } catch (error) {
        console.error('🎯 Error generating adaptive feedback:', error);
        messages.push("📈 Your goal recommendations have been updated based on your progress!");
      } finally {
        // ✅ Clean up any remaining session data for this user (in case of errors)
        const allSessionKeys = Object.keys(sessionStorage).filter(key => 
          key.startsWith(`exerciseSession_${userId}_`)
        );
        allSessionKeys.forEach(key => {
          sessionStorage.removeItem(key);
          console.log('🧹 Cleaned up session data:', key);
        });
      }
    }

    // Show completion message
    const newCompletedCount = Completedcount + 1;
    setCompletedCount(newCompletedCount);
    
    // ❌ REMOVED: Confidence improvement message to avoid conflicting with adaptive feedback
    // The adaptive feedback system already considers confidence levels in its messaging
    // This prevents double messages that could confuse the user
    
    // Check if confidence has improved (for internal tracking only)
    if (currentGoal.confidenceBefore && postConfidence > currentGoal.confidenceBefore) {
      console.log('🎯 Confidence improved from', currentGoal.confidenceBefore, 'to', postConfidence);
      // Note: Adaptive feedback system will handle confidence-related messaging
    }

    // Check if all goals completed
    const updatedCompletedGoals = newGoals.filter(g => g.completed).length;
    const isAllCompleted = updatedCompletedGoals === totalGoals;
    if (isAllCompleted) {
      messages.push("🎉 Awesome! You've completed all your goals!");
      setTimeout(() => {
        confetti({
          particleCount: 200,
          spread: 90,
          origin: { y: 0.6 }
        });
      }, 300);
    }

    // Show messages sequentially
    let delay = 0;
    messages.forEach((message) => {
      setTimeout(() => {
        setAgentMessage(message);
        setShowCheckIn(true);
      }, delay);
      delay += 3000;
    });

    // Show celebration for high satisfaction
    if (postSatisfaction >= 4) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    }

    setShowAppraisalModal(null);

  } catch (error) {
    console.error("Failed to submit appraisal", error);
    setAgentMessage("❌ Something went wrong with the submission.");
    setShowCheckIn(true);
  }
}


async function removeGoal(id: number) {
  try {
  setReasonPrompt({ goalId: id, action: "Delete" });
  } catch (error) {
    console.error("Failed to initiate goal deletion", error);
  }
}
  return (
    <GoalCompletionProvider completeGoalByTitle={completeGoalByTitle}>
      <div
        style={{
          background: "#229EBC",
          borderRadius: compact ? "clamp(4px, 1vw, 8px)" : "clamp(8px, 2vw, 12px)",
          padding: compact ? "clamp(0.5rem, 2vw, 0.75rem)" : "clamp(0.75rem, 3vw, 2rem)",
          maxWidth: compact ? "none" : "600px",
          margin: compact ? "0" : "auto",
          boxShadow: compact ? "0 4px 12px rgba(0, 0, 0, 0.15)" : "0 10px 30px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
          fontSize: "clamp(0.75rem, 2vw, 0.9rem)",
          height: compact ? "100%" : "auto",
          minHeight: compact ? "500px" : "auto",
          display: compact ? "flex" : "block",
          flexDirection: compact ? "column" : "initial",
        }}
      >
      {/* Progress Bar */}
      {!compact && <div style={{ marginBottom: "2rem" }}>
        <div
          style={{
            background: "#f0f0f0",
            borderRadius: "10px",
            height: "8px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <div
            style={{
              width: `${progressPercent}%`,
              height: "100%",
              background: progressPercent === 100 ? "linear-gradient(90deg, #4caf50, #45a049)" : "linear-gradient(90deg, #2196f3, #21cbf3)",
              transition: "width 0.3s ease",
              borderRadius: "10px",
            }}
          />
        </div>
        <div
          style={{
            textAlign: "center",
            fontSize: "clamp(0.7rem, 1.8vw, 0.9rem)",
            color: "#666",
            marginTop: "0.5rem",
          }}
        >
          Progress: {completedGoals} completed • {activeGoals} active goals remaining
        </div>
      </div>}

      {/* Activity Summary */}
      {/* <div
        style={{
          backgroundColor: "#007bff",
          padding: "1rem 1.2rem",
          borderRadius: "12px",
          color: "white",
          fontWeight: "700",
          fontSize: "1.1rem",
          marginBottom: "1rem",
          textAlign: "center",
          boxShadow: "0 4px 12px rgba(0, 123, 255, 0.3)",
        }}
        aria-label="Goal Activity Summary"
      >
        <div>➕ Goals Added: <strong>{addCount}</strong></div>
        <div>✅ Goals Completed: <strong>{Completedcount}</strong></div>
        <div>🗑️ Goals Deleted: <strong>{deleteCount}</strong></div>
      </div> */}

      {/* Main Goals Section */}
      <div
        style={{
          background: "white",
          padding: "clamp(0.5rem, 2vw, 1rem)",
          borderRadius: "clamp(4px, 1.5vw, 8px)",
          marginBottom: compact ? "0" : "clamp(0.5rem, 1.5vw, 1rem)",
          border: showOnlyCompleted ? "2px solid #4caf50" : "2px solid #000000ff",
          flex: compact ? "1" : "initial",
          display: compact ? "flex" : "block",
          flexDirection: compact ? "column" : "initial",
          minHeight: compact ? "0" : "auto",
        }}
      >
        <h3 style={{
          color: showOnlyCompleted ? "#4caf50" : "#1976d2",
          marginBottom: "clamp(0.5rem, 1.5vw, 0.75rem)",
          fontSize: "clamp(0.85rem, 2.2vw, 1.1rem)",
          textAlign: "center",
          fontWeight: "600"
        }}>
          {showOnlyCompleted 
            ? `✅ Completed Goals (${filteredGoals.length})` 
            : showOnlyActive 
              ? `🎯 Your Active Goals (${filteredGoals.length})`
              : `🎯 Your Goals (${filteredGoals.length})`
          }
        </h3>
        
        {filteredGoals.length === 0 ? (
          <div style={{
            textAlign: "center",
            color: "#666",
            fontStyle: "italic",
            padding: "clamp(1rem, 3vw, 2rem)",
            fontSize: "clamp(0.75rem, 1.8vw, 0.9rem)"
          }}>
            {showOnlyCompleted 
              ? "No completed goals yet. Keep working on your active goals!" 
              : showOnlyActive
                ? "No active goals. Create some goals to get started!"
                : "No goals yet. Create your first goal!"
            }
          </div>
        ) : (
          <div
            style={{
              maxHeight: compact ? "none" : "clamp(200px, 40vh, 350px)",
              height: compact ? "100%" : "auto",
              flex: compact ? "1" : "initial",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "clamp(0.5rem, 1.5vw, 0.75rem)",
            }}
            aria-label={showOnlyCompleted ? "Completed Goals List" : "Active Goals List"}
          >
            {filteredGoals.map((goal) =>
          editingGoalId === goal.id ? (
            <div
              key={goal.id}
              style={{
                background: "#229EBC",
                padding: "1rem",
                borderRadius: "10px",
                border: "1px solid black",
                fontFamily: "'Comic Sans MS', cursive, sans-serif",
                color: "white",
                boxShadow: "0 4px 8px rgba(0,0,0,0.15)",
              }}
            >
              {/* Title */}
              <h4 style={{ 
                textAlign: "center", 
                marginTop: 0,
                marginBottom: "1rem",
                color: "white",
                fontSize: "1rem",
                fontWeight: "bold"
              }}>
                ✏️ Edit Your Goal
              </h4>

              {/* 3-Column Grid Layout */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr 1fr",
                gap: "0.8rem",
                marginBottom: "1rem"
              }}>
                
                {/* Step 1: Category */}
                <div style={{
                  background: editCategory ? "#e8f5e8" : "#fff",
                  padding: "0.7rem",
                  borderRadius: "6px",
                  border: "2px solid #333",
                  color: "#333"
                }}>
                  <h5 style={{ 
                    margin: "0 0 0.4rem 0", 
                    color: "#333",
                    fontSize: "0.8rem",
                    fontWeight: "bold"
                  }}>
                    <span style={{ color: editCategory ? "#28a745" : "#007bff" }}>1.</span> Category
                  </h5>
                  <select
                    value={editCategory}
                    onChange={(e) => {
                      const newCategory = e.target.value;
                      setEditCategory(newCategory);
                      setEditTitle("");
                      // Set first available difficulty for the new category
                      const availableDifficulties = categorizedGoals[newCategory]
                        ? [...new Set(categorizedGoals[newCategory].map(g => g.difficulty))]
                        : [];
                      if (availableDifficulties.length > 0) {
                        setEditDifficulty(availableDifficulties[0]);
                      }
                    }}
                    style={{
                      width: "100%",
                      padding: "0.4rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                      backgroundColor: editCategory ? "#f8fff8" : "white"
                    }}
                  >
                    <option value="">Select...</option>
                    {Object.keys(categorizedGoals).map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                  {editCategory && (
                    <div style={{ 
                      marginTop: "0.3rem", 
                      fontSize: "0.65rem", 
                      color: "#28a745",
                      fontWeight: "bold"
                    }}>
                      ✓ Selected
                    </div>
                  )}
                </div>

                {/* Step 2: Difficulty */}
                <div style={{
                  background: (editCategory && editDifficulty) ? "#e8f5e8" : editCategory ? "#fff" : "#f5f5f5",
                  padding: "0.7rem",
                  borderRadius: "6px",
                  border: "2px solid #333",
                  color: "#333",
                  opacity: editCategory ? 1 : 0.6
                }}>
                  <h5 style={{ 
                    margin: "0 0 0.4rem 0", 
                    color: "#333",
                    fontSize: "0.8rem",
                    fontWeight: "bold"
                  }}>
                    <span style={{ color: (editCategory && editDifficulty) ? "#28a745" : "#007bff" }}>2.</span> Difficulty
                  </h5>
                  <select
                    value={editDifficulty}
                    onChange={(e) => {
                      setEditDifficulty(e.target.value);
                      setEditTitle("");
                    }}
                    disabled={!editCategory}
                    style={{
                      width: "100%",
                      padding: "0.4rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      fontSize: "0.75rem",
                      cursor: editCategory ? "pointer" : "not-allowed",
                      backgroundColor: (editCategory && editDifficulty) ? "#f8fff8" : editCategory ? "white" : "#f0f0f0"
                    }}
                  >
                    {editCategory && (() => {
                      const availableDifficulties = [...new Set(categorizedGoals[editCategory].map(g => g.difficulty))].sort((a, b) => {
                        const order = { "very easy": 0, "easy": 1, "medium": 2, "hard": 3, "very hard": 4 };
                        return (order[a as keyof typeof order] || 0) - (order[b as keyof typeof order] || 0);
                      });
                      const difficultyEmojis: Record<string, string> = {
                        "very easy": "🟦", "easy": "🟢", "medium": "🟡", "hard": "🔴", "very hard": "⚫"
                      };
                      const difficultyLabels: Record<string, string> = {
                        "very easy": "Very Easy", "easy": "Easy", "medium": "Medium", "hard": "Hard", "very hard": "Very Hard"
                      };
                      return availableDifficulties.map(diff => (
                        <option key={diff} value={diff}>
                          {difficultyEmojis[diff]} {difficultyLabels[diff]}
                        </option>
                      ));
                    })()}
                  </select>
                  {editCategory && editDifficulty && (
                    <div style={{ 
                      marginTop: "0.3rem", 
                      fontSize: "0.65rem", 
                      color: "#28a745",
                      fontWeight: "bold"
                    }}>
                      ✓ Selected
                    </div>
                  )}
                </div>

                {/* Step 3: Goal */}
                <div style={{
                  background: editTitle ? "#e8f5e8" : (editCategory && editDifficulty) ? "#fff" : "#f5f5f5",
                  padding: "0.7rem",
                  borderRadius: "6px",
                  border: "2px solid #333",
                  color: "#333",
                  opacity: (editCategory && editDifficulty) ? 1 : 0.6
                }}>
                  <h5 style={{ 
                    margin: "0 0 0.4rem 0", 
                    color: "#333",
                    fontSize: "0.8rem",
                    fontWeight: "bold"
                  }}>
                    <span style={{ color: editTitle ? "#28a745" : "#007bff" }}>3.</span> Goal
                  </h5>
                  <select
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    disabled={!editCategory || !editDifficulty}
                    style={{
                      width: "100%",
                      padding: "0.4rem",
                      borderRadius: "4px",
                      border: "1px solid #ccc",
                      fontSize: "0.75rem",
                      cursor: (editCategory && editDifficulty) ? "pointer" : "not-allowed",
                      backgroundColor: editTitle ? "#f8fff8" : (editCategory && editDifficulty) ? "white" : "#f0f0f0"
                    }}
                  >
                    <option value="">Select...</option>
                    {editCategory && editDifficulty && 
                      categorizedGoals[editCategory]
                        .filter(g => g.difficulty === editDifficulty)
                        .map((goalOption, i) => (
                          <option key={i} value={goalOption.title}>{goalOption.title}</option>
                        ))}
                  </select>
                  {editTitle && (
                    <div style={{ 
                      marginTop: "0.3rem", 
                      fontSize: "0.65rem", 
                      color: "#28a745",
                      fontWeight: "bold"
                    }}>
                      ✓ Selected
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                gap: "0.8rem",
                marginTop: "0.5rem"
              }}>
                <button
                  onClick={saveEdit}
                  disabled={!editTitle}
                  style={{
                    backgroundColor: editTitle ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    cursor: editTitle ? "pointer" : "not-allowed",
                    boxShadow: editTitle ? "0 3px 6px rgba(40,167,69,0.5)" : "none",
                    transition: "all 0.3s ease",
                    opacity: editTitle ? 1 : 0.6
                  }}
                  onMouseEnter={(e) => {
                    if (editTitle) e.currentTarget.style.backgroundColor = "#218838";
                  }}
                  onMouseLeave={(e) => {
                    if (editTitle) e.currentTarget.style.backgroundColor = "#28a745";
                  }}
                  aria-label="Save goal edit"
                >
                  💾 Save Changes
                </button>

                <button
                  onClick={cancelEditing}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "0.6rem 1.5rem",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    boxShadow: "0 3px 6px rgba(220,53,69,0.5)",
                    transition: "background-color 0.3s ease",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#c82333")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#dc3545")}
                  aria-label="Cancel goal edit"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              key={goal.id}
              style={{
                padding: "clamp(0.5rem, 1.5vw, 0.75rem)",
                border: "2px solid #e0e0e0",
                borderRadius: "clamp(4px, 1vw, 6px)",
                background: "white",
                cursor: "pointer",
                transition: "all 0.3s ease",
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                fontSize: "clamp(0.75rem, 1.8vw, 0.9rem)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#2196f3";
                e.currentTarget.style.background = "#f8f9ff";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "#e0e0e0";
                e.currentTarget.style.background = "white";
              }}
              aria-label={`Goal: ${goal.title}, difficulty: ${goal.difficulty}, category: ${goal.category}, status: ${goal.completed ? "completed" : "pending"}`}
            >
              <div style={{ marginBottom: "clamp(0.5rem, 2vw, 1rem)" }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  gap: "clamp(0.3rem, 1vw, 0.5rem)",
                  alignItems: "start",
                  marginBottom: "clamp(0.3rem, 1vw, 0.5rem)"
                }}>
                  <div>
                    <div style={{ 
                      fontSize: "clamp(0.5rem, 1.2vw, 0.65rem)", 
                      fontWeight: "600", 
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                      marginBottom: "clamp(0.1rem, 0.5vw, 0.2rem)"
                    }}>
                      Category
                    </div>
                    <div style={{ 
                      color: "#2196f3", 
                      fontWeight: "600",
                      fontSize: "clamp(0.65rem, 1.4vw, 0.75rem)",
                      padding: "clamp(0.1rem, 0.3vw, 0.15rem) clamp(0.2rem, 0.8vw, 0.4rem)",
                      backgroundColor: "#e3f2fd",
                      borderRadius: "3px",
                      display: "inline-block"
                    }}>
                      {goal.category}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ 
                      fontSize: "clamp(0.5rem, 1.2vw, 0.65rem)", 
                      fontWeight: "600", 
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                      marginBottom: "clamp(0.1rem, 0.5vw, 0.2rem)"
                    }}>
                      Goal
                    </div>
                    <div style={{
                      fontWeight: "600",
                      fontSize: "clamp(0.7rem, 1.6vw, 0.8rem)",
                      color: "#333",
                      lineHeight: "1.2"
                    }}>
                      {goal.title}
                    </div>
                  </div>
                  
                  <div>
                    <div style={{ 
                      fontSize: "clamp(0.5rem, 1.2vw, 0.65rem)", 
                      fontWeight: "600", 
                      color: "#666",
                      textTransform: "uppercase",
                      letterSpacing: "0.3px",
                      marginBottom: "clamp(0.1rem, 0.5vw, 0.2rem)"
                    }}>
                      Difficulty
                    </div>
                    <div style={{ 
                      fontSize: "clamp(0.6rem, 1.3vw, 0.7rem)", 
                      fontWeight: "600",
                      color: "#555",
                      padding: "clamp(0.1rem, 0.3vw, 0.15rem) clamp(0.2rem, 0.8vw, 0.4rem)",
                      backgroundColor: "#f5f5f5",
                      borderRadius: "3px",
                      display: "inline-block"
                    }}>
                      {getDifficultyDisplay(goal.difficulty)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons - only show for active goals */}
              {!showOnlyCompleted && (
                <div
                  style={{
                    display: "flex",
                    gap: "clamp(0.25rem, 1vw, 0.4rem)",
                    marginTop: "clamp(0.5rem, 1.5vw, 0.75rem)",
                    flexWrap: "wrap",
                  }}
                >
                  <button
                    onClick={() => startEditing(goal)}
                    style={{
                      padding: "clamp(0.25rem, 1vw, 0.4rem) clamp(0.5rem, 1.5vw, 0.8rem)",
                      background: "#ffc107",
                      color: "white",
                      border: "none",
                      borderRadius: "clamp(2px, 1vw, 4px)",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "clamp(0.65rem, 1.4vw, 0.8rem)",
                      transition: "background 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e0a800")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#ffc107")}
                    aria-label={`Edit goal ${goal.title}`}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => removeGoal(goal.id)}
                    style={{
                      padding: "clamp(0.25rem, 1vw, 0.4rem) clamp(0.5rem, 1.5vw, 0.8rem)",
                      background: "#dc3545",
                      color: "white",
                      border: "none",
                      borderRadius: "clamp(2px, 1vw, 4px)",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "clamp(0.65rem, 1.4vw, 0.8rem)",
                      transition: "background 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#c82333")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#dc3545")}
                    aria-label={`Delete goal ${goal.title}`}
                  >
                    🗑️ Delete
                  </button>

                  <button
                    onClick={() => setShowGuidanceModal(goal.title)}
                    style={{
                      padding: "clamp(0.25rem, 1vw, 0.4rem) clamp(0.5rem, 1.5vw, 0.8rem)",
                      background: "#17a2b8",
                      color: "white",
                      border: "none",
                      borderRadius: "clamp(2px, 1vw, 4px)",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "clamp(0.65rem, 1.4vw, 0.8rem)",
                      transition: "background 0.3s ease",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#138496")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "#17a2b8")}
                    aria-label={`View completion guide for ${goal.title}`}
                  >
                    💡 How to complete
                  </button>

                  {!goal.completed ? (
                    /* COMMENTED OUT: Mark as Done button removed per professor feedback
                    <button
                      onClick={() => handleMarkAsDone(goal.id)}
                      style={{
                        padding: "0.4rem 0.8rem",
                        background: "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontWeight: "600",
                        fontSize: "0.8rem",
                        transition: "background 0.3s ease",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#45a049")}
                      onMouseLeave={(e) => (e.currentTarget.style.background = "#4caf50")}
                      aria-label={`Mark goal ${goal.title} as done`}
                    >
                      ✅ Mark as Done
                    </button>
                    */
                    <div style={{
                      color: "#666",
                      fontSize: "clamp(0.65rem, 1.4vw, 0.8rem)",
                      fontStyle: "italic"
                    }}>
                      Goals complete automatically through exercises
                    </div>
                  ) : (
                    <span
                      style={{
                        color: "#4caf50",
                        fontWeight: "600",
                        fontSize: "clamp(0.65rem, 1.4vw, 0.8rem)",
                        alignSelf: "center",
                      }}
                      aria-label="Goal completed"
                    >
                      ✅ Done
                    </span>
                  )}
                </div>
              )}

              {/* Show completion status for completed goals */}
              {showOnlyCompleted && (
                <div style={{
                  marginTop: "clamp(0.3rem, 1vw, 0.5rem)",
                  padding: "clamp(0.25rem, 1vw, 0.4rem)",
                  backgroundColor: "#e8f5e8",
                  borderRadius: "clamp(2px, 1vw, 4px)",
                  textAlign: "center",
                  border: "1px solid #4caf50"
                }}>
                  <span style={{
                    color: "#4caf50",
                    fontWeight: "600",
                    fontSize: "clamp(0.6rem, 1.3vw, 0.75rem)"
                  }}>
                    ✅ Completed {goal.updatedAt ? new Date(goal.updatedAt).toLocaleDateString() : 'Recently'}
                  </span>
                </div>
              )}
            </div>
          )
        )}
        </div>
        )}
      </div>

      {/* Move modals outside the goals container */}
      {reasonPrompt && (
        <ReasonPrompt
          title={`Why did you ${reasonPrompt.action.toLowerCase()} this goal?`}
          placeholder="Explain your reason..."
          onCancel={() => setReasonPrompt(null)}
          onSubmit={async (reason) => {
            try {
              await logReason(reasonPrompt.goalId, reasonPrompt.action, reason);
              
              // Only proceed with deletion if action is "Delete"
              if (reasonPrompt.action === "Delete") {
                await deleteGoal(reasonPrompt.goalId);
                const newGoals = goals.filter((g) => g.id !== reasonPrompt.goalId);
                onGoalsChange(newGoals);
                setAgentMessage(
                  "🗑️ It's okay to remove goals if they feel too much, just remember to complete what you have!"
                );
                setShowCheckIn(true);
              }
              
              setReasonPrompt(null);
            } catch (error) {
              console.error("Failed to process deletion", error);
              setReasonPrompt(null);
            }
          }}
        />
      )}

      {feedbackData && (
        <DiscrepancyFeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => {
            setShowFeedbackModal(false);
            setFeedbackData(null);
          }}
          expected={feedbackData.expected}
          perceived={feedbackData.perceived}
          actual={feedbackData.actual}
        />
      )}

      {/* Retrospective modal - moved outside goals.map for proper rendering */}
      {(() => {
        const isModalOpen = selectedGoalId !== null;
        console.log(`🎯 Rendering RetrospectiveModal with isOpen: ${isModalOpen}, selectedGoalId: ${selectedGoalId}`);
        console.log(`🎯 Modal props check: isOpen=${isModalOpen}, hasOnClose=${!!handleSubmitRetrospective}, hasOnSubmit=${!!setSelectedGoalId}`);
        return null;
      })()}
      <RetrospectiveModal
        isOpen={selectedGoalId !== null}
        onClose={() => {
          console.log(`🎯 RetrospectiveModal onClose called`);
          setSelectedGoalId(null);
          setAutoCalculatedScore(null); // Reset auto score when closing
          setContributingExercises(null); // Reset contributing exercises when closing
        }}
        onSubmit={handleSubmitRetrospective}
        goalTitle={selectedGoalId ? goals.find(g => g.id === selectedGoalId)?.title : undefined}
        autoCalculatedScore={autoCalculatedScore || undefined}
        expectedMistakes={selectedGoalId ? goals.find(g => g.id === selectedGoalId)?.expectedMistakes : undefined}
        contributingExercises={contributingExercises || undefined}
      />

      {/* Simulate Auto-Complete Button
      <button
        onClick={() => completeGoalByTitle("Understand how substitution works")}
        style={{
          marginTop: "1rem",
          backgroundColor: "#17a2b8",
          color: "white",
          border: "none",
          padding: "0.7rem 1.5rem",
          borderRadius: "15px",
          fontWeight: "700",
          fontSize: "1rem",
          cursor: "pointer",
          boxShadow: "0 3px 8px rgba(23,162,184,0.6)",
          transition: "background-color 0.3s ease",
          display: "block",
          marginLeft: "auto",
          marginRight: "auto",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#117a8b")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#17a2b8")}
        aria-label="Simulate Auto-Complete"
      >
        🎯 Simulate Auto-Complete
      </button> */}

      {/* Agent popup */}
      {showCheckIn && agentMessage && (
        <AgentPopup
          message={agentMessage}
          image={FemaleAfricanSmiling}
          onClose={() => {
            setShowCheckIn(false);
            setAgentMessage(null);
          }}
        />
      )}

      {showAppraisalModal && (
  <PostTaskAppraisal
    isOpen={true}
    onClose={() => setShowAppraisalModal(null)}
    onSubmit={handleAppraisalSubmit}
  />
)}

      {/* Goal Completion Guidance Modal */}
      {showGuidanceModal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          fontFamily: "'Comic Sans MS', cursive, sans-serif"
        }}
        onClick={() => setShowGuidanceModal(null)}
        >
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "500px",
            maxHeight: "80vh",
            overflowY: "auto",
            margin: "1rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "3px solid #229EBC"
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem"
            }}>
              <h3 style={{
                margin: 0,
                color: "#229EBC",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}>
                🎯 How to Complete This Goal
              </h3>
              <button
                onClick={() => setShowGuidanceModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#666",
                  padding: "0.2rem"
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              backgroundColor: "#f8f9ff",
              padding: "1rem",
              borderRadius: "8px",
              border: "2px solid #e1e8ff",
              marginBottom: "1rem"
            }}>
              <h4 style={{
                margin: "0 0 0.5rem 0",
                color: "#333",
                fontSize: "1rem",
                fontWeight: "bold"
              }}>
                "{showGuidanceModal}"
              </h4>
            </div>

            <div style={{
              backgroundColor: "#f0f8ff",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "2px solid #229EBC",
              lineHeight: "1.6"
            }}>
              <div style={{
                color: "#333",
                fontSize: "0.9rem",
                fontWeight: "500",
                whiteSpace: "pre-line"
              }}>
                {goalCompletionGuide[showGuidanceModal] || "Completion guidance not available for this goal."}
              </div>
            </div>

            <div style={{
              marginTop: "1.5rem",
              textAlign: "center"
            }}>
              <button
                onClick={() => setShowGuidanceModal(null)}
                style={{
                  backgroundColor: "#229EBC",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.9rem",
                  fontFamily: "'Comic Sans MS', cursive, sans-serif"
                }}
              >
                Got it! 👍
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </GoalCompletionProvider>
  );
}
