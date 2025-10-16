import React, { useEffect, useState } from "react";
import { fetchGoals, createGoal, checkPretestStatus as checkPretestStatusAPI, getUserPerformanceStats, getRecommendationReasons } from "@/utils/api";
import { Goal, GoalInput } from "@/types/goal";
import { GoalForm } from "@/components/goalsetting/GoalForm";
import { GoalList } from "@/components/goalsetting/GoalList";
import AgentPopup from "@/components/PedologicalAgent";
import { PretestModal } from "@/components/pretest/PretestModal";
import { getStudySession } from "@/utils/studySession";

import FemaleAfricanSmiling from "@images/flexibility/AfroAmerican_F_Smiling.png";

// Goal completion guidance mapping
const goalCompletionGuide: Record<string, string> = {
  // Basic Understanding (5 goals)
  "Learn what linear equations are": "🎯 How to Complete:\n• Start any Flexibility Exercise (Suitability, Efficiency, or Matching)\n• This goal completes automatically when you first access linear equation content\n\n📚 Completes on first exercise access!",
  
  "Understand how substitution works": "🔄 How to Complete:\n• Complete 1 exercise using the Substitution method\n• Choose substitution in any Flexibility Exercise\n• Successfully solve the problem\n\n� Specific Exercises for Substitution:\n• Exercise #2 (Efficiency) - Substitution focus\n• Exercise #9 (Matching) - Substitution practice\n• Any Suitability exercise - Choose substitution when appropriate\n\n�💡 Completes after your first successful substitution exercise!",
  
  "Understand how elimination works": "⚖️ How to Complete:\n• Complete 1 exercise using the Elimination method\n• Choose elimination in any Flexibility Exercise\n• Successfully solve the problem\n\n� Specific Exercises for Elimination:\n• Exercise #6 (Efficiency) - Elimination focus\n• Exercise #7 (Matching) - Elimination practice\n• Exercise #11 (Efficiency) - More elimination practice\n• Any Suitability exercise - Choose elimination when appropriate\n\n�💡 Completes after your first successful elimination exercise!",
  
  "Understand how equalization works": "⚖️ How to Complete:\n• Complete 1 exercise using the Equalization method\n• Choose equalization in any Flexibility Exercise\n• Successfully solve the problem\n\n📚 Specific Exercises for Equalization:\n• Exercise #2 (Matching) - Equalization focus\n• Exercise #13 (Matching) - More equalization practice\n• Any Suitability exercise - Choose equalization when appropriate\n\n💡 Completes after your first successful equalization exercise!",
  
  "Master all three methods fluently": "🏆 How to Complete:\n• Complete 2+ exercises with each method (substitution, elimination, equalization)\n• Demonstrates comprehensive method mastery\n• Shows fluency across all solving approaches\n\n📚 Method-Specific Exercises:\n• Substitution: Efficiency #2, Matching #9\n• Elimination: Efficiency #6&#11, Matching #7\n• Equalization: Matching #2&#13\n• All Methods: Any Suitability exercise\n\n🏅 Completes when you've mastered all three methods individually!",

  // Method Mastery (5 goals)
  "Master substitution/equalization/elimination method": "🏆 How to Complete:\n• Complete 2 exercises either using Substitution/Equalization/Elimination method\n• Shows growing competence with substitution\n• Can be any combination of exercise types\n\n⭐ Completes after your second substitution exercise success!",
  
  "Practice with different methods": "🔄 How to Complete:\n• Use 2 different methods across any exercises\n• For example: 1 substitution exercise + 1 elimination exercise\n• Shows willingness to explore different approaches\n\n🎲 Completes when you've tried 2 different methods!",
  
  "Switch methods strategically": "🧠 How to Complete:\n• Complete 3 exercises using different methods each time\n• Demonstrates strategic method selection\n• Shows flexibility in problem-solving approach\n\n� Completes after using 3 different methods across 3 exercises!",
  
  "Choose optimal methods consistently": "⚡ How to Complete:\n• Complete 3 Efficiency Exercises (where method choice matters most)\n• Focuses on optimal method selection\n• Shows consistent strategic thinking\n\n🚀 Completes after 3 successful Efficiency Exercise completions!",

  // Problem Solving (5 goals)
  "Complete exercises without hints": "🎖️ How to Complete:\n• Complete 1 exercise using 0 hints\n• Demonstrates full independence on that exercise\n• Shows confidence in your abilities\n\n💪 Completes when you finish an exercise without any hints!",
  
  "Solve problems with minimal errors": "⭐ How to Complete:\n• Complete 1 exercise with ≤1 error\n• Shows accuracy and careful problem-solving\n• Focus on precision over speed\n\n🎯 Completes when you make 1 or fewer errors in an exercise!",
  
  "Handle complex problems confidently": "🌟 How to Complete:\n• Complete 5 total exercises (any type/method)\n• Shows sustained engagement and practice\n• Builds confidence through experience\n\n� Completes after your 5th total exercise completion!",
  
  "Show exceptional problem-solving": "🏅 How to Complete:\n• Complete 1 exercise with 0 errors AND 0 hints\n• Demonstrates exceptional skill and independence\n• The perfect exercise completion\n\n✨ Completes when you achieve a flawless exercise (no errors, no hints)!",
  
  "Maintain accuracy under pressure": "� How to Complete:\n• Complete 5+ exercises with average ≤1 error across all exercises\n• Shows consistent accuracy over time\n• Demonstrates skill under sustained challenge\n\n🎯 Completes when your overall error average ≤1.0 across 5+ exercises!",

  // Learning & Growth (5 goals)  
  "Build confidence through success": "💪 How to Complete:\n• Complete 1 exercise using 2 or fewer hints\n• Shows growing independence\n• Focus on working with less assistance\n\n⭐ Completes when hint usage is 2 or less in an exercise!",
  
  "Develop problem-solving resilience": "🌱 How to Complete:\n• Complete 1 exercise after making at least 1 error\n• Shows ability to recover and persist through mistakes\n• Demonstrates growth mindset and resilience\n\n💪 Completes when you successfully finish an exercise despite making errors!",
  
  "Learn from mistakes effectively": "📈 How to Complete:\n• Complete exercises where recent performance shows fewer errors than earlier attempts\n• Demonstrates improvement over time through learning\n• Shows growth mindset in action\n\n� Completes when error tracking shows clear improvement trend!",
  
  "Set personal learning challenges": "🎯 How to Complete:\n• Complete 10 total exercises (any type/method)\n• Shows commitment to sustained learning\n• Demonstrates self-directed challenge-seeking\n\n🏆 Completes after your 10th total exercise completion!",
  
  "Track progress meaningfully": "🌟 How to Complete:\n• Complete exercises using all 3 different methods (substitution, elimination, equalization)\n• Shows comprehensive engagement with all approaches\n• Demonstrates holistic learning approach\n\n🌟 Completes when you've successfully used all three methods!",

  "Reflect on method effectiveness": "🤔 How to Complete:\n• Complete an exercise with self-explanation in Matching Exercise or Efficiency Exercise\n• Provide thoughtful reasoning about method choices\n• Shows deeper analytical thinking\n\n📖 Completes when you engage with self-explanation features!",

  "Explain reasoning clearly": "🗣️ How to Complete:\n• Complete 3 exercises with self-explanation components\n• Consistently engage with reasoning prompts\n• Shows strong metacognitive skills\n\n🧠 Completes after 3 successful self-explanation exercises!",
  
  "Show consistent improvement": "📈 How to Complete:\n• Complete 4 exercises with decreasing error rates over time\n• Demonstrates sustained learning and improvement\n• Shows mastery through consistent progress\n\n🎯 Completes when error data shows consistent improvement trend!",
  
  "Work independently": "👑 How to Complete:\n• Complete 3 exercises with 0 hints each\n• Shows consistent independent problem-solving\n• Demonstrates true mastery and confidence\n\n🏆 The ultimate independence achievement - 3 hint-free exercises!"
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
              
              // Get difficulty color and emoji
              const getDifficultyStyle = (diff: string) => {
                const diffLower = diff.toLowerCase();
                if (diffLower.includes('very easy')) return { color: '#28a745', emoji: '🟢', label: 'Very Easy' };
                if (diffLower.includes('easy')) return { color: '#20c997', emoji: '🟡', label: 'Easy' };
                if (diffLower.includes('medium')) return { color: '#ffc107', emoji: '🟠', label: 'Medium' };
                if (diffLower.includes('hard') && !diffLower.includes('very')) return { color: '#fd7e14', emoji: '🔴', label: 'Hard' };
                if (diffLower.includes('very hard')) return { color: '#dc3545', emoji: '⚫', label: 'Very Hard' };
                return { color: '#6c757d', emoji: '⚪', label: difficulty };
              };
              
              const diffStyle = getDifficultyStyle(difficulty);
              
              return (
                <div key={index} style={{ 
                  backgroundColor: 'white',
                  padding: '10px',
                  borderRadius: '6px',
                  border: '1px solid #e3f2fd',
                  fontSize: '0.8rem'
                }}>
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: '6px'
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
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#1976d2',
                        padding: '1px 6px',
                        backgroundColor: '#e3f2fd',
                        borderRadius: '3px'
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
                        display: 'flex',
                        alignItems: 'center',
                        gap: '2px',
                        fontSize: '0.65rem',
                        fontWeight: '600',
                        color: diffStyle.color,
                        padding: '1px 4px',
                        backgroundColor: 'rgba(255,255,255,0.8)',
                        borderRadius: '3px',
                        border: `1px solid ${diffStyle.color}40`
                      }}>
                        <span style={{ fontSize: '0.7rem' }}>{diffStyle.emoji}</span>
                        <span>{diffStyle.label}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <span style={{ 
                      fontSize: '0.65rem',
                      fontWeight: '600',
                      color: '#64748b',
                      textTransform: 'uppercase'
                    }}>
                      Goal:
                    </span>
                  </div>
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingLeft: '4px'
                  }}>
                    <div style={{ 
                      fontSize: '0.8rem',
                      color: '#424242',
                      fontWeight: '500',
                      lineHeight: '1.3',
                      flex: 1
                    }}>
                      {title}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowGuidance(showGuidance === title ? null : title)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        padding: "0.2rem",
                        borderRadius: "50%",
                        color: "#1976d2",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "18px",
                        height: "18px",
                        marginLeft: "6px"
                      }}
                      title="How to complete this goal"
                    >
                      ℹ️
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRecommendationReason(showRecommendationReason === title ? null : title)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.8rem",
                        padding: "0.2rem",
                        borderRadius: "50%",
                        color: "#ff9800",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "18px",
                        height: "18px",
                        marginLeft: "4px"
                      }}
                      title="Why is this goal recommended?"
                    >
                      🧠
                    </button>
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
            💡 Use the Goal Form below to add these to your list!
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
        <GoalForm onCreate={handleCreateGoal} userId={userId} />
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
    <button
      onClick={() => {
        const newCount = exerciseCount + 1;
        setExerciseCount(newCount);
        if (newCount % 3 === 0) setShowCheckIn1(true);
      }}
      style={{
        marginTop: "1rem",
        padding: "0.6rem 1.2rem",
        background: "#28a745",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        cursor: "pointer",
        width: window.innerWidth <= 768 ? "100%" : "auto"
      }}
    >
      ✅ Simulate Exercise Completion
    </button>

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
              lineHeight: "1.6",
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              <div style={{
                color: "#333",
                fontSize: "0.9rem",
                fontWeight: "500",
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
          backgroundColor: "rgba(0, 0, 0, 0.6)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            padding: "2rem",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            fontFamily: "'Comic Sans MS', cursive, sans-serif"
          }}>
            <h3 style={{
              color: "#ff9800",
              marginBottom: "1rem",
              fontSize: "1.3rem",
              textAlign: "center",
              fontWeight: "bold"
            }}>
              🧠 Why is this goal recommended?
            </h3>
            
            <div style={{
              backgroundColor: "#fff3e0",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "2px solid #ff9800",
              marginBottom: "1.5rem",
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              <div style={{
                color: "#333",
                fontSize: "0.9rem",
                fontWeight: "500",
                whiteSpace: "pre-line"
              }}>
                {getRecommendationReason(showRecommendationReason)}
              </div>
            </div>

            <div style={{
              marginTop: "1.5rem",
              textAlign: "center"
            }}>
              <button
                onClick={() => setShowRecommendationReason(null)}
                style={{
                  backgroundColor: "#ff9800",
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
                Makes sense! 🎯
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
