import React, { useEffect, useState } from "react";
import { fetchGoals, createGoal, checkPretestStatus as checkPretestStatusAPI, getUserPerformanceStats, getRecommendationReasons, completeGoalWithScore } from "@/utils/api";
import { Goal, GoalInput } from "@/types/goal";
import { GoalForm } from "@/components/goalsetting/GoalForm";
import { GoalList } from "@/components/goalsetting/GoalList";
import AgentPopup from "@/components/PedologicalAgent";
import { PretestModal } from "@/components/pretest/PretestModal";
import { getStudySession } from "@/utils/studySession";
import { checkGoalConditionsSatisfied, getGoalSatisfactionReason } from "@/utils/implicitGoalChecker";

import FemaleAfricanSmiling from "@images/flexibility/AfroAmerican_F_Smiling.png";

// Goal completion guidance mapping
const goalCompletionGuide: Record<string, string> = {
  // Basic Understanding (5 goals)
  "Learn what linear equations are": "✅ What to do:\nStart any Flexibility Exercise\n\n📚 Exercises you can choose:\n• Suitability Exercise\n• Efficiency Exercise\n• Matching Exercise\n\n✓ Completes automatically on first exercise",
  
  "Understand how substitution works": "✅ What to do:\nComplete 1 exercise using Substitution method\n\n📚 Exercises you can choose:\n• Exercise #2 (Efficiency)\n• Exercise #9 (Matching)\n• Any Suitability exercise",
  
  "Understand how elimination works": "✅ What to do:\nComplete 1 exercise using Elimination method\n\n📚 Exercises you can choose:\n• Exercise #6 (Efficiency)\n• Exercise #7 (Matching)\n• Exercise #11 (Efficiency)\n• Any Suitability exercise",
  
  "Understand how equalization works": "✅ What to do:\nComplete 1 exercise using Equalization method\n\n📚 Exercises you can choose:\n• Exercise #2 (Matching)\n• Exercise #13 (Matching)\n• Any Suitability exercise",

  // Method Mastery (5 goals)
  "Master substitution/equalization/elimination method": "✅ What to do:\nComplete 2 exercises using Substitution, Equalization, OR Elimination method\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise\n• Pick the same method twice",
  
  "Practice with different methods": "✅ What to do:\nComplete 2 exercises using 2 DIFFERENT methods\n\nExample: 1 Substitution + 1 Elimination\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise",
  
  "Switch methods strategically": "✅ What to do:\nComplete 3 exercises using a DIFFERENT method each time\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise\n• Use all 3 methods (Substitution, Elimination, Equalization)",
  
  "Choose optimal methods consistently": "✅ What to do:\nComplete 3 Efficiency Exercises\n\n📚 Exercises you can choose:\n• Any Efficiency Exercise (#1-14)",

  "Master all three methods fluently": "✅ What to do:\nComplete 2+ exercises with EACH method\n\nMeans: 2 Substitution + 2 Elimination + 2 Equalization = 6 exercises total\n\n� Exercises you can choose:\n• Substitution: Exercise #2, #9\n• Elimination: Exercise #6, #7, #11\n• Equalization: Exercise #2, #13\n• Any Suitability exercise",

  // Problem Solving (5 goals)
  "Complete exercises without hints": "✅ What to do:\nComplete 1 exercise using 0 hints\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise",
  
  "Solve problems with minimal errors": "✅ What to do:\nComplete 1 exercise with 1 or fewer errors\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise",
  
  "Handle complex problems confidently": "✅ What to do:\nComplete 5 exercises total\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise\n• Any method",
  
  "Show exceptional problem-solving": "✅ What to do:\nComplete 1 exercise with 0 errors AND 0 hints\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise",

  "Maintain accuracy under pressure": "✅ What to do:\nComplete 5+ exercises with average of 1 error or less\n\nExample: If you do 5 exercises, you can make max 5 total errors\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise",

  // Learning & Growth (5 goals)  
  "Build confidence through success": "✅ What to do:\nComplete 1 exercise using 2 or fewer hints\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise",
  
  "Develop problem-solving resilience": "✅ What to do:\nComplete 1 exercise even if you make errors\n\nMake at least 1 error, then finish the exercise\n\n� Exercises you can choose:\n• Any Flexibility Exercise",
  
  "Learn from mistakes effectively": "✅ What to do:\nMake fewer errors in recent exercises than earlier ones\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise\n• System tracks improvement automatically",
  
  "Set personal learning challenges": "✅ What to do:\nComplete 10 exercises total\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise\n• Any method",

  "Reflect on method effectiveness": "✅ What to do:\nComplete 1 exercise with self-explanation\n\n📚 Exercises you can choose:\n• Matching Exercise\n• Efficiency Exercise",

  "Explain reasoning clearly": "✅ What to do:\nComplete 3 exercises with self-explanation\n\n📚 Exercises you can choose:\n• Matching Exercise\n• Efficiency Exercise",
  
  "Show consistent improvement": "✅ What to do:\nComplete 4 exercises with fewer errors each time\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise\n• System tracks improvement automatically",
  
  "Work independently": "✅ What to do:\nComplete 3 exercises with 0 hints each\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise"
};

export default function GoalSettingView({ userId: propUserId }: { userId?: number }) {
  const [goals, setGoals] = useState<Goal[]>([]);

  
  // Use propUserId if provided, otherwise get from study session or default to 1
  const getCurrentUserId = (): number => {
    if (propUserId) return propUserId;
    const studySession = getStudySession();
    return studySession ? studySession.userId : 1;
  };
  
  const [userId, setUserId] = useState(getCurrentUserId());
  const [inputUserId, setInputUserId] = useState(getCurrentUserId().toString());
  const [exerciseCount, setExerciseCount] = useState(0);
  const [showCheckIn1, setShowCheckIn1] = useState(false);
  const [showCheckIn, setShowCheckIn] = useState(false);
  const [agentMessage, setAgentMessage] = useState<string | null>(null);
  const [suggestedCategory, setSuggestedCategory] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  

//  future authentication working
 // const { user } = useAuth();
//const userId = user?.id || 1; // Dynamic from auth, fallback to 1

// Same exact props - no other changes needed!
        <GoalList goals={goals} onGoalsChange={setGoals} userId={userId} />
  // Pretest related state
  const [showPretest, setShowPretest] = useState(false);
  const [pretestCompleted, setPretestCompleted] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<string[]>([]);
  const [showGuidance, setShowGuidance] = useState<string | null>(null);
  const [showRecommendationReason, setShowRecommendationReason] = useState<string | null>(null);
  const [recommendationReasons, setRecommendationReasons] = useState<Record<string, string>>({});
  const [loadingReason, setLoadingReason] = useState<string | null>(null);
  const [prefilledGoal, setPrefilledGoal] = useState<{category: string, title: string, difficulty: string} | null>(null);
  const [claimingGoal, setClaimingGoal] = useState<{category: string, title: string, difficulty: string} | null>(null);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<{
    totalGoalsCompleted: number;
    averageActualScore: number;
    averageConfidence: number;
    averageHintsPerGoal: number;
    averageErrorsPerGoal: number;
  } | null>(null);

  // Update userId when study session changes (but don't override manual input in public mode)
  useEffect(() => {
    const studySession = getStudySession();
    
    // Only auto-update if there's an active study session OR if propUserId is provided
    if (studySession || propUserId) {
      const newUserId = getCurrentUserId();
      console.log('🎯 GoalSettingView auto-updating userId - current:', userId, 'new:', newUserId, 'studySession:', !!studySession, 'propUserId:', propUserId);
      if (newUserId !== userId) {
        console.log('🎯 GoalSettingView updating userId from', userId, 'to', newUserId);
        setUserId(newUserId);
        setInputUserId(newUserId.toString());
      }
    }
    // In public mode without study session, let manual input work without auto-overriding
  }, [propUserId, userId]);

  useEffect(() => {
    // Check if user has completed pretest from database
    const checkPretestStatus = async () => {
      try {
        console.log('Checking pretest status for user:', userId);
        const status = await checkPretestStatusAPI(userId);
        console.log('Pretest status response:', status);
        
        if (!status.hasCompleted) {
          console.log('User has NOT completed pretest, showing modal');
          setShowPretest(true);
        } else {
          console.log('User HAS completed pretest, suggested goals:', status.suggestedGoals);
          setPretestCompleted(true);
          const suggestions = status.suggestedGoals || [];
          setSuggestedGoals(suggestions);
          
          // Fetch recommendation reasons for initial suggested goals
          if (suggestions.length > 0) {
            getRecommendationReasons(userId, suggestions).then(reasons => {
              console.log('💡 Initial recommendation reasons loaded:', reasons);
              setRecommendationReasons(reasons);
            }).catch(err => {
              console.error('❌ Failed to fetch initial recommendation reasons:', err);
            });
          }
        }
      } catch (error) {
        console.error('Error checking pretest status:', error);
        // If API fails, show pretest by default
        console.log('API error, defaulting to show pretest');
        setShowPretest(true);
      }
    };

    checkPretestStatus();

    fetchGoals(userId)
      .then(setGoals)
      .catch(err => console.error("Failed to fetch goals:", err));

    // Fetch performance statistics
    getUserPerformanceStats(userId)
      .then(result => {
        console.log('📊 Performance stats for user', userId, ':', result.stats);
        setPerformanceStats(result.stats);
      })
      .catch(err => {
        console.error('❌ Failed to fetch performance stats:', err);
      });

    // Listen for dynamic goal suggestion updates and fetch recommendation reasons
    const handleSuggestionUpdate = async (event: CustomEvent) => {
      console.log('💡 Received updated suggestions:', event.detail.suggestions);
      setSuggestedGoals(event.detail.suggestions);
      
      // Fetch detailed reasons for each recommended goal
      if (event.detail.suggestions && event.detail.suggestions.length > 0) {
        const reasons = await getRecommendationReasons(userId, event.detail.suggestions);
        console.log('💡 Fetched recommendation reasons:', reasons);
        setRecommendationReasons(reasons);
      }
    };

    window.addEventListener('goalSuggestionsUpdated', handleSuggestionUpdate as any);
    
    return () => {
      window.removeEventListener('goalSuggestionsUpdated', handleSuggestionUpdate as any);
    };
  }, [userId]);

  useEffect(() => {
    document.body.style.backgroundImage = "url('./src/assets/images/home/exercises.png')";
    document.body.style.backgroundRepeat = "no-repeat";
    document.body.style.backgroundSize = "cover";

    return () => {
      document.body.style.background = ""; // cleanup when leaving page
    };
  }, []);
  
useEffect(() => {
  const handleResize = () => {
    setIsMobile(window.innerWidth <= 768);
  };

  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = parseInt(inputUserId);
    if (!isNaN(id) && id !== userId) {
      console.log('🎯 Manual userId change from', userId, 'to', id);
      setUserId(id);
      // Goals will be refetched automatically due to the useEffect dependency on userId
    }
  };

  const handleCreateGoal = async (partialInput: Omit<GoalInput, "userId">) => {
    try {
      console.log('🎯 Creating goal with userId:', userId, 'type:', typeof userId);
      const fullGoalInput: GoalInput = { ...partialInput, userId };
      console.log('🎯 Full goal input:', fullGoalInput);
      const newGoal = await createGoal(fullGoalInput);
      const updatedGoals = [...goals, newGoal];
      setGoals(updatedGoals);

      // Only count ACTIVE goals in the same category (not completed ones)
      const activeCategoryUsage = updatedGoals.filter(g => 
        g.category === fullGoalInput.category && !g.completed
      ).length;
      
      if (activeCategoryUsage >= 2) {
        setShowCheckIn(true);
        setSuggestedCategory(fullGoalInput.category);
        setAgentMessage(
          `You have ${activeCategoryUsage} active "${fullGoalInput.category}" goals. Try goals from different categories too!`
        );
      }
    } catch (err) {
      console.error("Failed to create goal:", err);
    }
  };

  const handlePretestComplete = (suggestedGoals: string[]) => {
    // Mark pretest as completed (already saved in DB)
    setPretestCompleted(true);
    setSuggestedGoals(suggestedGoals);
    setShowPretest(false);
  };

  const handlePretestClose = () => {
    // Just close without saving anything
    setShowPretest(false);
  };

  // Fetch reason for a specific goal on-demand
  const fetchReasonForGoal = async (goalTitle: string) => {
    console.log('💡 Fetching reason on-demand for:', goalTitle);
    setLoadingReason(goalTitle);
    
    // Find the full suggestion string for this goal title
    const matchingSuggestion = suggestedGoals.find(sg => {
      const parts = sg.split('|');
      return parts.length >= 2 && parts[1] === goalTitle;
    });
    
    if (matchingSuggestion) {
      console.log('💡 Found matching suggestion:', matchingSuggestion);
      const reasons = await getRecommendationReasons(userId, [matchingSuggestion]);
      console.log('💡 Fetched reason:', reasons);
      
      if (reasons && reasons[goalTitle]) {
        setRecommendationReasons(prev => ({ ...prev, [goalTitle]: reasons[goalTitle] }));
      }
    }
    
    setLoadingReason(null);
  };
  
  // Simple lookup function for backend-generated reasons
  const getRecommendationReason = (goalTitle: string): string => {
    console.log('💡 Looking up recommendation reason for:', goalTitle);
    
    if (recommendationReasons && recommendationReasons[goalTitle]) {
      console.log('✅ Found cached reason for:', goalTitle);
      return recommendationReasons[goalTitle];
    }
    
    // Check if currently loading
    if (loadingReason === goalTitle) {
      return `🎯 ${goalTitle}\n\n⏳ Loading detailed recommendation based on your performance data...\n\nPlease wait while we analyze your learning patterns...`;
    }
    
    // Trigger fetch and show loading message
    console.log('⏳ Fetching reason from backend for:', goalTitle);
    fetchReasonForGoal(goalTitle);
    
    return `🎯 ${goalTitle}\n\n⏳ Loading detailed recommendation based on your performance data...\n\nThis goal was selected by our adaptive recommendation system based on your progress and learning patterns.`;
  };

  // Function to handle quick-add recommended goal
  const handleQuickAddGoal = (goal: string) => {
    const goalParts = goal.split('|');
    
    if (goalParts.length === 3) {
      const [category, title, difficulty] = goalParts;
      
      // Check if goal already exists
      const goalExists = goals.some(existingGoal => 
        existingGoal.title === title && existingGoal.category === category
      );
      
      if (goalExists) {
        setAgentMessage("📌 This goal is already in your goal list!");
        setShowCheckIn(true);
        return;
      }
      
      // Pre-fill the goal form
      setPrefilledGoal({ category, title, difficulty });
      
      // Scroll to goal form
      const goalFormElement = document.querySelector('[data-goal-form]');
      if (goalFormElement) {
        goalFormElement.scrollIntoView({ behavior: 'smooth' });
      }
      
      setAgentMessage(`✨ Goal form pre-filled with: "${title}". Just set your self-efficacy questions and click create!`);
      setShowCheckIn(true);
    } else {
      console.warn('Invalid goal format for quick-add:', goal);
    }
  };

  return (
     <div
    style={{
      padding: "1rem",
      width: "100%",
      maxWidth: "1400px",
      margin: "0 auto",
      fontFamily: "'Comic Sans MS', cursive, sans-serif",
      color: "white",
      minHeight: "100vh",
      boxSizing: "border-box",
    }}
  >
    {/* USER SWITCHER - made more compact for mobile */}
    <form
      onSubmit={handleSubmit}
      style={{ 
        display: "flex", 
        flexWrap: "wrap",
        alignItems: "center", 
        marginBottom: "1.5rem", 
        gap: "0.5rem" 
      }}
    >
      <input
        type="text"
        placeholder="Enter User ID"
        value={inputUserId}
        onChange={(e) => setInputUserId(e.target.value)}
        style={{
          padding: "0.5rem 1rem",
          borderRadius: "8px",
          border: "1px solid #ccc",
          width: "150px",
          maxWidth: "100%"
        }}
      />
      <button
        type="submit"
        style={{
          padding: "0.5rem 1rem",
          background: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
        }}
      >
        Load User
      </button>
    </form>

    <h1 style={{ 
      fontSize: "clamp(1.2rem, 4vw, 1.8rem)", 
      marginBottom: "1rem" 
    }}>
      🎯 Set Your Learning Goals
    </h1>

    {/* Learning Profile panel removed - focus is on "Why recommended?" explanations in goal cards */}

    {/* Show suggested goals if pretest was completed */}
    {pretestCompleted && suggestedGoals.length > 0 && (
      <div style={{ 
        backgroundColor: 'rgba(227, 242, 253, 0.95)', 
        padding: '1rem', 
        borderRadius: '10px', 
        marginBottom: '1rem',
        border: '2px solid #2196f3',
        boxShadow: '0 2px 8px rgba(33, 150, 243, 0.15)'
      }}>
        <h3 style={{ 
          color: '#1976d2', 
          marginBottom: '0.5rem', 
          fontSize: '1.1rem',
          fontWeight: 'bold',
          textAlign: 'center'
        }}>
          🎯 Your Adaptive Recommendations
        </h3>
        
        {performanceStats && performanceStats.totalGoalsCompleted > 0 && (
          <div style={{
            backgroundColor: 'rgba(255, 255, 255, 0.7)',
            padding: '0.5rem',
            borderRadius: '6px',
            marginBottom: '0.75rem',
            fontSize: '0.9rem',
            color: '#555',
            textAlign: 'center',
            fontStyle: 'italic'
          }}>
            These goals are personalized based on your {performanceStats.totalGoalsCompleted} completed goals.
            Click "💡 Why recommended?" to see detailed reasoning.
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '8px',
          marginBottom: '0.75rem'
        }}>
          {suggestedGoals.slice(0, 3).map((goal, index) => {
            // Parse the new format "Category|Title|Difficulty" or fallback to old format
            const goalParts = goal.split('|');
            
            if (goalParts.length === 3) {
              const [category, title, difficulty] = goalParts;
              
              // Check if goal already exists in the user's goal list
              const goalExists = goals.some(existingGoal => 
                existingGoal.title === title && existingGoal.category === category
              );
              
              // Check if goal conditions are already satisfied
              const isAlreadySatisfied = !goalExists && checkGoalConditionsSatisfied(userId, title);
              const satisfactionReason = isAlreadySatisfied ? getGoalSatisfactionReason(userId, title) : "";
              
              // Get difficulty color and emoji - matching GoalForm style
              const getDifficultyStyle = (diff: string) => {
                const diffLower = diff.toLowerCase();
                if (diffLower.includes('very easy')) return { color: '#007bff', emoji: '🟦', label: 'Very Easy' };
                if (diffLower.includes('easy')) return { color: '#28a745', emoji: '🟢', label: 'Easy' };
                if (diffLower.includes('medium')) return { color: '#ffc107', emoji: '🟡', label: 'Medium' };
                if (diffLower.includes('hard') && !diffLower.includes('very')) return { color: '#dc3545', emoji: '🔴', label: 'Hard' };
                if (diffLower.includes('very hard')) return { color: '#343a40', emoji: '⚫', label: 'Very Hard' };
                return { color: '#6c757d', emoji: '⚪', label: difficulty };
              };
              
              const diffStyle = getDifficultyStyle(difficulty);
              
              return (
                <div key={index} style={{ 
                  backgroundColor: 'white',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '2px solid #e3f2fd',
                  fontSize: '0.8rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                }}>
                  {/* Goal Title - Large and Blue at Top */}
                  <div style={{ 
                    fontSize: '1.1rem',
                    color: '#1976d2',
                    fontWeight: 'bold',
                    lineHeight: '1.4',
                    marginBottom: '8px',
                    paddingBottom: '8px',
                    borderBottom: '1px solid #e3f2fd'
                  }}>
                    Goal : {title}
                  </div>

                  {/* Category and Difficulty Below Title */}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '10px',
              
                    gap: '5px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ 
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase'
                      }}>
                        Category:
                      </span>
                      <span style={{ 
                        fontSize: '0.6rem',
                        fontWeight: '600',
                        color: '#1976d2',
                        padding: '3px 8px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '4px',
                        display: 'inline-flex',
                        alignItems: 'center',
                        width: 'fit-content',
                        whiteSpace: 'nowrap'
                      }}>
                        {category}
                      </span>
                    </div>
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <span style={{ 
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        color: '#64748b',
                        textTransform: 'uppercase'
                      }}>
                        Difficulty:
                      </span>
                      <div style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '0.5rem',
                        fontWeight: '600',
                        color: diffStyle.color,
                        padding: '3px 8px',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        borderRadius: '4px',
                        border: `1.5px solid ${diffStyle.color}40`,
                        width: 'fit-content',
                        whiteSpace: 'nowrap'
                      }}>
                        <span style={{ fontSize: '0.75rem' }}>{diffStyle.emoji}</span>
                        <span>{diffStyle.label}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons - Larger and More Prominent */}
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '8px'
                  }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setShowRecommendationReason(showRecommendationReason === title ? null : title)}
                        style={{
                          background: "#fff3e0",
                          border: "1px solid #ff9800",
                          cursor: "pointer",
                          fontSize: "0.75rem",
                          padding: "0.4rem 0.6rem",
                          borderRadius: "6px",
                          color: "#ff9800",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          fontWeight: "600",
                          transition: "all 0.2s"
                        }}
                        title="Why is this goal recommended?"
                      >
                        <span>💡</span>
                        <span>Why?</span>
                      </button>
                    </div>
                    
                    {/* Button container - show both buttons when conditions satisfied */}
                    <div style={{
                      display: "flex",
                      gap: "0.5rem",
                      alignItems: "center"
                    }}>
                      {/* Show informational notification button if conditions are satisfied */}
                      {isAlreadySatisfied && (
                        <button
                          type="button"
                          onClick={() => {
                            setClaimingGoal({ category, title, difficulty });
                            setShowClaimModal(true);
                          }}
                          style={{
                            background: "linear-gradient(135deg, #2196f3 0%, #1976d2 100%)",
                            border: "1px solid #1565c0",
                            cursor: "pointer",
                            fontSize: "0.55rem",
                            padding: "0.4rem 0.8rem",
                            borderRadius: "5px",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            fontWeight: "100",
                            boxShadow: "0 2px 6px rgba(33, 150, 243, 0.3)",
                            transition: "all 0.2s"
                          }}
                          title={satisfactionReason}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "scale(1.03)";
                            e.currentTarget.style.boxShadow = "0 3px 8px rgba(33, 150, 243, 0.4)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(33, 150, 243, 0.3)";
                          }}
                        >
                          <span style={{ fontSize: '0.8rem' }}>✓</span>
                          <span style={{fontSize: '0.80rem',fontFamily:"Comic Sans MS"}}>Condition fullfilled</span>
                        </button>
                      )}
                      
                      {/* Always show Add Goal button */}
                      <button
                        type="button"
                        onClick={() => !goalExists && handleQuickAddGoal(goal)}
                        disabled={goalExists}
                        style={{
                          background: goalExists 
                            ? "#e0e0e0" 
                            : "linear-gradient(135deg, #4caf50 0%, #45a049 100%)",
                          border: "none",
                          cursor: goalExists ? "not-allowed" : "pointer",
                          fontSize: "0.85rem",
                          padding: "0.5rem 1rem",
                          borderRadius: "6px",
                          color: goalExists ? "#9e9e9e" : "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          fontWeight: "700",
                          boxShadow: goalExists 
                            ? "none" 
                            : "0 2px 6px rgba(76, 175, 80, 0.3)",
                          transition: "all 0.2s",
                          opacity: goalExists ? 0.6 : 1
                        }}
                        title={goalExists ? "Goal already added to your list" : "Add this goal to your list"}
                        onMouseEnter={(e) => {
                          if (!goalExists) {
                            e.currentTarget.style.transform = "scale(1.05)";
                            e.currentTarget.style.boxShadow = "0 4px 12px rgba(76, 175, 80, 0.4)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!goalExists) {
                            e.currentTarget.style.transform = "scale(1)";
                            e.currentTarget.style.boxShadow = "0 2px 6px rgba(76, 175, 80, 0.3)";
                          }
                        }}
                      >
                        <span style={{ fontSize: '1rem' }}>{goalExists ? '✓' : '+'}</span>
                        <span>{goalExists ? 'Added' : 'Add Goal'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            } else {
              // Fallback for old format "Category - Title"
              const [category, ...titleParts] = goal.split(' - ');
              const title = titleParts.join(' - ');
              
              return (
                <div key={index} style={{ 
                  backgroundColor: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: '1px solid #e3f2fd',
                  fontSize: '0.85rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}>
                  <span style={{ fontSize: '1rem' }}>📌</span>
                  <div style={{ flex: 1 }}>
                    <strong style={{ 
                      color: '#1976d2', 
                      fontSize: '0.8rem',
                      display: 'block',
                      lineHeight: '1.2'
                    }}>{category}</strong>
                    {title && (
                      <span style={{ 
                        color: '#424242', 
                        fontSize: '0.75rem',
                        display: 'block',
                        marginTop: '1px',
                        lineHeight: '1.2'
                      }}>{title}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      // Convert old format to new format with default difficulty
                      const convertedGoal = `${category}|${title || category}|easy`;
                      handleQuickAddGoal(convertedGoal);
                    }}
                    style={{
                      background: "#4caf50",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "0.7rem",
                      padding: "0.25rem 0.4rem",
                      borderRadius: "4px",
                      color: "white",
                      fontWeight: "600",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.2)"
                    }}
                    title="Add this goal to your list"
                  >
                    + Add
                  </button>
                </div>
              );
            }
          })}
        </div>
        <div style={{ 
          textAlign: 'center'
        }}>
          <small style={{ 
            color: '#1565c0', 
            fontStyle: 'italic',
            fontSize: '0.75rem'
          }}>
            💡 You can use the add goal button to prefill the goal form or add a goal of your choice from the goal form below.
          </small>
        </div>
      </div>
    )}

    {/* Responsive container for GoalForm, Active Goals, and Completed Goals */}
    <div style={{ 
      display: "flex", 
      flexDirection: window.innerWidth <= 768 ? "column" : "row",
      gap: "1rem",
      height: "auto",
      minHeight: "calc(100vh - 200px)",
      margin: "1rem 0"
    }}>
      {/* Goal Form - Left Side */}
      <div style={{ 
        flex: window.innerWidth <= 768 ? "1" : "1 1 30%",
        minWidth: window.innerWidth <= 768 ? "100%" : "350px",
        maxHeight: window.innerWidth <= 768 ? "50vh" : "100%",
        overflowY: "auto"
      }}>
        <GoalForm 
          onCreate={handleCreateGoal} 
          userId={userId} 
          prefilledGoal={prefilledGoal}
          onPrefilledGoalUsed={() => setPrefilledGoal(null)}
        />
      </div>

      {/* Active Goals - Center */}
      <div style={{ 
        flex: window.innerWidth <= 768 ? "1" : "1 1 40%",
        minWidth: window.innerWidth <= 768 ? "100%" : "400px",
        maxHeight: window.innerWidth <= 768 ? "50vh" : "100%",
        overflowY: "auto"
      }}>
        <GoalList 
          goals={goals} 
          onGoalsChange={setGoals} 
          userId={userId}
          showOnlyActive={true}
        />
      </div>

      {/* Completed Goals - Right Side */}
      <div style={{ 
        flex: window.innerWidth <= 768 ? "1" : "1 1 30%",
        minWidth: window.innerWidth <= 768 ? "100%" : "350px",
        maxHeight: window.innerWidth <= 768 ? "50vh" : "100%",
        overflowY: "auto"
      }}>
        <GoalList 
          goals={goals} 
          onGoalsChange={setGoals} 
          userId={userId}
          showOnlyCompleted={true}
        />
      </div>
    </div>

    {/* Make the exercise button responsive */}
   

      {/* Check-in after exercise */}
      {showCheckIn1 && (
        <div
          style={{
            position: "fixed",
            bottom: "2rem",
            left: "2rem",
            display: "flex",
            alignItems: "flex-start",
            zIndex: 1000,
          }}
        >
          <img src={FemaleAfricanSmiling} alt="Pedagogical Agent" style={{ width: "100px" }} />
          <div
            style={{
              position: "relative",
              marginLeft: "0.5rem",
              padding: "1rem",
              background: "#fff",
              borderRadius: "12px",
              border: "2px solid #ccc",
              boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
              maxWidth: "280px",
              fontFamily: "inherit",
              color: "#000",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "-10px",
                top: "20px",
                width: 0,
                height: 0,
                borderTop: "10px solid transparent",
                borderBottom: "10px solid transparent",
                borderRight: "10px solid #ccc",
              }}
            />
            <h4 style={{ marginTop: 0 }}>🎯 Goal Check-In</h4>
            <p>Are you still working on your current goal?</p>
            <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
              <button onClick={() => setShowCheckIn1(false)}>✅ Yes, continue</button>
              <button
                onClick={() => {
                  setShowCheckIn1(false);
                  alert("You can now revise your goal");
                }}
              >
                ✏️ Revise Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agent suggestion */}
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

      {/* Pretest Modal */}
      {showPretest && (
        <PretestModal
          isOpen={showPretest}
          onClose={handlePretestClose}
          onComplete={handlePretestComplete}
          userId={userId}
        />
      )}

      {/* Completion Guidance Modal */}
      {showGuidance && (
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
        onClick={() => setShowGuidance(null)}
        >
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "500px",
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
                onClick={() => setShowGuidance(null)}
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
                "{showGuidance}"
              </h4>
            </div>

            <div style={{
              backgroundColor: "#f0f8ff",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "2px solid #229EBC",
              lineHeight: "1.8",
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              <div style={{
                color: "#1a1a1a",
                fontSize: "1rem",
                fontWeight: "700",
                whiteSpace: "pre-line"
              }}>
                {goalCompletionGuide[showGuidance] || "Completion guidance not available for this goal."}
              </div>
            </div>

            <div style={{
              marginTop: "1.5rem",
              textAlign: "center"
            }}>
              <button
                onClick={() => setShowGuidance(null)}
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

      {/* Recommendation Reason Modal */}
      {showRecommendationReason && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.7)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "0",
            maxWidth: "700px",
            width: "95%",
            maxHeight: "85vh",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
            fontFamily: "'Comic Sans MS', cursive, sans-serif",
            overflow: "hidden"
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              padding: "1.5rem",
              color: "white",
              textAlign: "center"
            }}>
              <h2 style={{
                margin: 0,
                fontSize: "1.5rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem"
              }}>
                🗺️ Your Learning Journey
              </h2>
              <p style={{
                margin: "0.5rem 0 0 0",
                fontSize: "0.9rem",
                opacity: 0.95
              }}>
                See where you are and where you're headed!
              </p>
            </div>
            
            {/* Content - Scrollable */}
            <div style={{
              padding: "2rem",
              maxHeight: "calc(85vh - 180px)",
              overflowY: "auto"
            }}>
              {/* Journey Map Visualization */}
              <div style={{
                position: "relative",
                padding: "1rem 0"
              }}>
                {/* Vertical Journey Path Line */}
                <div style={{
                  position: "absolute",
                  left: "30px",
                  top: "20px",
                  bottom: "20px",
                  width: "4px",
                  background: "linear-gradient(180deg, #4caf50 0%, #667eea 50%, #9e9e9e 100%)",
                  borderRadius: "2px",
                  zIndex: 0
                }}></div>
                
                {/* Parse and display journey sections */}
                <div style={{
                  position: "relative",
                  zIndex: 1
                }}>
                  {(() => {
                    const reasonText = getRecommendationReason(showRecommendationReason);
                    
                    // Parse the simplified 3-line format from backend
                    const lines = reasonText.split('\n').filter(line => line.trim());
                    const bulletPoints = lines.filter(line => line.trim().startsWith('•'));
                    
                    // Extract the 3 key points: Condition, What it Indicates, How it Helps
                    let conditionMatched = '';
                    let whatThisMeans = '';
                    let howItHelps = '';
                    
                    bulletPoints.forEach(line => {
                      const content = line.substring(line.indexOf('•') + 1).trim();
                      if (content.startsWith('Condition Matched:')) {
                        conditionMatched = content.replace('Condition Matched:', '').trim();
                      } else if (content.startsWith('What This Indicates:')) {
                        whatThisMeans = content.replace('What This Indicates:', '').trim();
                      } else if (content.startsWith('How This Goal Helps:')) {
                        howItHelps = content.replace('How This Goal Helps:', '').trim();
                      }
                    });
                    
                    return (
                      <>
                        {/* Pattern Matched - Condition */}
                        {conditionMatched && (
                          <div style={{ marginBottom: "2rem", paddingLeft: "60px" }}>
                            <div style={{
                              position: "absolute",
                              left: "12px",
                              width: "40px",
                              height: "40px",
                              backgroundColor: "#667eea",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.2rem",
                              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.5)",
                              border: "4px solid white",
                              animation: "pulse 2s infinite"
                            }}>
                              🎯
                            </div>
                            <h4 style={{ 
                              margin: "0 0 0.5rem 0",
                              color: "#667eea",
                              fontSize: "1.1rem",
                              fontWeight: "bold"
                            }}>
                              PATTERN MATCHED
                            </h4>
                            <div style={{
                              backgroundColor: "#e8eaf6",
                              padding: "1rem",
                              borderRadius: "8px",
                              border: "2px solid #667eea"
                            }}>
                              <p style={{ margin: 0, color: "#1a237e", fontSize: "0.9rem", fontWeight: "500", lineHeight: "1.6" }}>
                                {conditionMatched}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* What This Indicates */}
                        {whatThisMeans && (
                          <div style={{ marginBottom: "2rem", paddingLeft: "60px" }}>
                            <div style={{
                              position: "absolute",
                              left: "12px",
                              width: "40px",
                              height: "40px",
                              backgroundColor: "#ff9800",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.2rem",
                              boxShadow: "0 4px 12px rgba(255, 152, 0, 0.5)",
                              border: "4px solid white"
                            }}>
                              📊
                            </div>
                            <h4 style={{ 
                              margin: "0 0 0.5rem 0",
                              color: "#ff9800",
                              fontSize: "1.1rem",
                              fontWeight: "bold"
                            }}>
                              WHAT THIS INDICATES
                            </h4>
                            <div style={{
                              backgroundColor: "#fff3e0",
                              padding: "1rem",
                              borderRadius: "8px",
                              border: "2px solid #ff9800"
                            }}>
                              <p style={{ margin: 0, color: "#e65100", fontSize: "0.9rem", fontWeight: "500", lineHeight: "1.6" }}>
                                {whatThisMeans}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* How This Goal Helps */}
                        {howItHelps && (
                          <div style={{ marginBottom: "2rem", paddingLeft: "60px" }}>
                            <div style={{
                              position: "absolute",
                              left: "12px",
                              width: "40px",
                              height: "40px",
                              backgroundColor: "#4caf50",
                              borderRadius: "50%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.2rem",
                              boxShadow: "0 4px 12px rgba(76, 175, 80, 0.5)",
                              border: "4px solid white"
                            }}>
                              💡
                            </div>
                            <h4 style={{ 
                              margin: "0 0 0.5rem 0",
                              color: "#4caf50",
                              fontSize: "1.1rem",
                              fontWeight: "bold"
                            }}>
                              HOW THIS GOAL HELPS
                            </h4>
                            <div style={{
                              backgroundColor: "#e8f5e9",
                              padding: "1rem",
                              borderRadius: "8px",
                              border: "2px solid #4caf50"
                            }}>
                              <p style={{ margin: 0, color: "#1b5e20", fontSize: "0.9rem", fontWeight: "500", lineHeight: "1.6" }}>
                                {howItHelps}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {/* Fallback if no data parsed */}
                        {!conditionMatched && !whatThisMeans && !howItHelps && (
                          <div style={{
                            padding: "2rem",
                            textAlign: "center",
                            color: "#666"
                          }}>
                            <p style={{ margin: 0, fontSize: "0.9rem" }}>
                              {reasonText || "Loading recommendation details..."}
                            </p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Footer Button */}
            <div style={{
              padding: "1.5rem",
              borderTop: "1px solid #e0e0e0",
              textAlign: "center",
              backgroundColor: "#f5f5f5"
            }}>
              <button
                onClick={() => setShowRecommendationReason(null)}
                style={{
                  background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                  border: "none",
                  padding: "0.85rem 2rem",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "1rem",
                  fontFamily: "'Comic Sans MS', cursive, sans-serif",
                  boxShadow: "0 4px 12px rgba(102, 126, 234, 0.3)",
                  transition: "all 0.3s ease"
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "scale(1.05)";
                  e.currentTarget.style.boxShadow = "0 6px 16px rgba(102, 126, 234, 0.4)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(102, 126, 234, 0.3)";
                }}
              >
                Got it! Let's do this! 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Claim Goal Modal - Shows when user wants to claim an implicit completion */}
      {showClaimModal && claimingGoal && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1001,
          backdropFilter: "blur(5px)"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "16px",
            padding: "0",
            maxWidth: "600px",
            width: "90%",
            boxShadow: "0 20px 60px rgba(0, 0, 0, 0.4)",
            fontFamily: "'Comic Sans MS', cursive, sans-serif",
            overflow: "hidden"
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)",
              padding: "2rem",
              textAlign: "center"
            }}>
              <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>🎉</div>
              <h2 style={{
                margin: 0,
                fontSize: "1.8rem",
                fontWeight: "bold",
                color: "#d84315"
              }}>
                Wozza! You Did It!
              </h2>
              <p style={{
                margin: "0.5rem 0 0 0",
                fontSize: "1rem",
                color: "#f57c00"
              }}>
                You've already satisfied the conditions for this goal!
              </p>
            </div>
            
            {/* Content */}
            <div style={{
              padding: "2rem"
            }}>
              {/* Goal Info */}
              <div style={{
                backgroundColor: "#fff3e0",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "2px solid #ff9800",
                marginBottom: "1.5rem"
              }}>
                <h3 style={{ 
                  margin: "0 0 0.5rem 0",
                  color: "#e65100",
                  fontSize: "1.3rem",
                  fontWeight: "bold"
                }}>
                  {claimingGoal.title}
                </h3>
                <div style={{ 
                  display: "flex",
                  gap: "1rem",
                  marginTop: "1rem",
                  flexWrap: "wrap"
                }}>
                  <div style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#e3f2fd",
                    borderRadius: "8px",
                    fontWeight: "600",
                    color: "#1976d2"
                  }}>
                    📂 {claimingGoal.category}
                  </div>
                  <div style={{
                    padding: "0.5rem 1rem",
                    backgroundColor: "#f3e5f5",
                    borderRadius: "8px",
                    fontWeight: "600",
                    color: "#7b1fa2"
                  }}>
                    ⚡ {claimingGoal.difficulty}
                  </div>
                </div>
              </div>

              {/* What You Did */}
              <div style={{
                backgroundColor: "#e8f5e9",
                padding: "1.5rem",
                borderRadius: "12px",
                border: "2px solid #4caf50",
                marginBottom: "1.5rem"
              }}>
                <h4 style={{ 
                  margin: "0 0 0.75rem 0",
                  color: "#2e7d32",
                  fontSize: "1.1rem",
                  fontWeight: "bold"
                }}>
                  ✨ What You Accomplished:
                </h4>
                <p style={{ 
                  margin: 0,
                  color: "#1b5e20",
                  fontSize: "1rem",
                  lineHeight: "1.6",
                  fontWeight: "500"
                }}>
                  {getGoalSatisfactionReason(userId, claimingGoal.title)}
                </p>
              </div>

              {/* Explanation */}
              <div style={{
                backgroundColor: "#f5f5f5",
                padding: "1.2rem",
                borderRadius: "8px",
                marginBottom: "1.5rem"
              }}>
                <p style={{ 
                  margin: 0,
                  color: "#555",
                  fontSize: "0.95rem",
                  lineHeight: "1.7",
                  textAlign: "center"
                }}>
                  You've already fulfilled the conditions for this goal! 
                  If you'd like to track it, you can add it to your goal list and on your next excerise completion it will be marked as completed.
                </p>
              </div>

              {/* Close Button */}
              <div style={{
                display: "flex",
                justifyContent: "center"
              }}>
                <button
                  onClick={() => {
                    setShowClaimModal(false);
                    setClaimingGoal(null);
                  }}
                  style={{
                    padding: "0.75rem 2rem",
                    backgroundColor: "#4caf50",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "600",
                    fontSize: "0.95rem",
                    fontFamily: "'Comic Sans MS', cursive, sans-serif",
                    transition: "all 0.2s",
                    boxShadow: "0 2px 8px rgba(76, 175, 80, 0.3)"
                  }}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#45a049";
                    e.currentTarget.style.transform = "scale(1.02)";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#4caf50";
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                >
                  Got It!
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
