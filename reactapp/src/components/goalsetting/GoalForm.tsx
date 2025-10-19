import React, { useState } from "react";
import { GoalInput } from "@/types/goal";

interface Props {
  onCreate: (goal: GoalInput) => void;
  userId: number;
  prefilledGoal?: {category: string, title: string, difficulty: string} | null;
  onPrefilledGoalUsed?: () => void;
}

// Goal completion guidance mapping
const goalCompletionGuide: Record<string, string> = {
  // Basic Understanding (5 goals)
  "Learn what linear equations are": "🎯 How to Complete:\n• Start any Flexibility Exercise (Suitability, Efficiency, or Matching)\n• This goal completes automatically when you first access linear equation content\n\n📚 Completes on first exercise access!",
  
  "Understand how substitution works": "🔄 How to Complete:\n• Complete 1 exercise using the Substitution method\n• Choose substitution in any Flexibility Exercise\n• Successfully solve the problem\n\n� Specific Exercises for Substitution:\n• Exercise #2 (Efficiency) - Substitution focus\n• Exercise #9 (Matching) - Substitution practice\n• Any Suitability exercise - Choose substitution when appropriate\n\n�💡 Completes after your first successful substitution exercise!",
  
  "Understand how elimination works": "⚖️ How to Complete:\n• Complete 1 exercise using the Elimination method\n• Choose elimination in any Flexibility Exercise\n• Successfully solve the problem\n\n� Specific Exercises for Elimination:\n• Exercise #6 (Efficiency) - Elimination focus\n• Exercise #7 (Matching) - Elimination practice\n• Exercise #11 (Efficiency) - More elimination practice\n• Any Suitability exercise - Choose elimination when appropriate\n\n�💡 Completes after your first successful elimination exercise!",
  
  "Understand how equalization works": "⚖️ How to Complete:\n• Complete 1 exercise using the Equalization method\n• Choose equalization in any Flexibility Exercise\n• Successfully solve the problem\n\n� Specific Exercises for Equalization:\n• Exercise #2 (Matching) - Equalization focus\n• Exercise #13 (Matching) - More equalization practice\n• Any Suitability exercise - Choose equalization when appropriate\n\n�💡 Completes after your first successful equalization exercise!",


  // Method Mastery (5 goals)
  "Master substitution/equalization/elimination method": "🏆 How to Complete:\n• Complete 2 exercises either using Substitution/Equalization/Elimination method\n• Shows growing competence with substitution\n• Can be any combination of exercise types\n\n⭐ Completes after your second substitution exercise success!",
  
  "Practice with different methods": "🔄 How to Complete:\n• Use 2 different methods across any exercises\n• For example: 1 substitution exercise + 1 elimination exercise\n• Shows willingness to explore different approaches\n\n🎲 Completes when you've tried 2 different methods!",
  
  "Switch methods strategically": "🧠 How to Complete:\n• Complete 3 exercises using different methods each time\n• Demonstrates strategic method selection\n• Shows flexibility in problem-solving approach\n\n🎯 Completes after using 3 different methods across 3 exercises!",
  
  "Choose optimal methods consistently": "⚡ How to Complete:\n• Complete 3 Efficiency Exercises (where method choice matters most)\n• Focuses on optimal method selection\n• Shows consistent strategic thinking\n\n🚀 Completes after 3 successful Efficiency Exercise completions!",

  "Master all three methods fluently": "🏆 How to Complete:\n• Complete 2+ exercises with each method (substitution, elimination, equalization)\n• Demonstrates comprehensive method mastery\n• Shows fluency across all solving approaches\n\n📚 Method-Specific Exercises:\n• Substitution: Efficiency #2, Matching #9\n• Elimination: Efficiency #6&#11, Matching #7\n• Equalization: Matching #2&#13\n• All Methods: Any Suitability exercise\n\n🏅 Completes when you've mastered all three methods individually!",

  // Problem Solving (5 goals)
  "Complete exercises without hints": "🎖️ How to Complete:\n• Complete 1 exercise using 0 hints\n• Demonstrates full independence on that exercise\n• Shows confidence in your abilities\n\n💪 Completes when you finish an exercise without any hints!",
  
  "Solve problems with minimal errors": "⭐ How to Complete:\n• Complete 1 exercise with ≤1 error\n• Shows accuracy and careful problem-solving\n• Focus on precision over speed\n\n🎯 Completes when you make 1 or fewer errors in an exercise!",
  
  "Handle complex problems confidently": "🌟 How to Complete:\n• Complete 5 total exercises (any type/method)\n• Shows sustained engagement and practice\n• Builds confidence through experience\n\n📈 Completes after your 5th total exercise completion!",
  
  "Show exceptional problem-solving": "🏅 How to Complete:\n• Complete 1 exercise with 0 errors AND 0 hints\n• Demonstrates exceptional skill and independence\n• The perfect exercise completion\n\n🏆 Completes when you achieve a flawless exercise (no errors, no hints)!",

  "Maintain accuracy under pressure": "💎 How to Complete:\n• Complete 5+ exercises with average ≤1 error across all exercises\n• Shows consistent accuracy over time\n• Demonstrates skill under sustained challenge\n\n� Completes when your overall error average ≤1.0 across 5+ exercises!",

  // Learning & Growth (5 goals)  
  "Build confidence through success": "💪 How to Complete:\n• Complete 1 exercise using 2 or fewer hints\n• Shows growing independence\n• Focus on working with less assistance\n\n⭐ Completes when hint usage is 2 or less in an exercise!",
  
  "Develop problem-solving resilience": "🌱 How to Complete:\n• Complete 1 exercise after making at least 1 error\n• Shows ability to recover and persist through mistakes\n• Demonstrates growth mindset and resilience\n\n💪 Completes when you successfully finish an exercise despite making errors!",
  
  "Learn from mistakes effectively": "📈 How to Complete:\n• Complete exercises where recent performance shows fewer errors than earlier attempts\n• Demonstrates improvement over time through learning\n• Shows growth mindset in action\n\n� Completes when error tracking shows clear improvement trend!",
  
  "Set personal learning challenges": "🎯 How to Complete:\n• Complete 10 total exercises (any type/method)\n• Shows commitment to sustained learning\n• Demonstrates self-directed challenge-seeking\n\n🏆 Completes after your 10th total exercise completion!",

  "Reflect on method effectiveness": "🤔 How to Complete:\n• Complete an exercise with self-explanation in Matching Exercise or Efficiency Exercise\n• Provide thoughtful reasoning about method choices\n• Shows deeper analytical thinking\n\n📖 Completes when you engage with self-explanation features!",

  "Explain reasoning clearly": "🗣️ How to Complete:\n• Complete 3 exercises with self-explanation components\n• Consistently engage with reasoning prompts\n• Shows strong metacognitive skills\n\n🧠 Completes after 3 successful self-explanation exercises!",
  
  "Show consistent improvement": "📈 How to Complete:\n• Complete 4 exercises with decreasing error rates over time\n• Demonstrates sustained learning and improvement\n• Shows mastery through consistent progress\n\n🎯 Completes when error data shows consistent improvement trend!",
  
  "Work independently": "👑 How to Complete:\n• Complete 3 exercises with 0 hints each\n• Shows consistent independent problem-solving\n• Demonstrates true mastery and confidence\n\n🏆 The ultimate independence achievement - 3 hint-free exercises!"
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
    { title: "Develop problem-solving resilience", difficulty: "medium" },
    { title: "Explain reasoning clearly", difficulty: "medium" },
    { title: "Show consistent improvement", difficulty: "hard" },
    { title: "Set personal learning challenges", difficulty: "hard" },
    { title: "Work independently", difficulty: "very hard" },
  ],
};

export function GoalForm({ onCreate, userId, prefilledGoal, onPrefilledGoalUsed }: Props) {
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedGoal, setSelectedGoal] = useState("");
  const [difficulty, setDifficulty] = useState("easy");
  const [confidenceBefore, setConfidenceBefore] = useState<number>(3); // Initialize with default value 3
  const [expectedMistakes, setExpectedMistakes] = useState<number>(3); // Initialize with default value 3
  const [motivationRating, setMotivationRating] = useState<number>(3); // Initialize with default value 3
  const [showGuidance, setShowGuidance] = useState<string | null>(null);

  // Effect to handle prefilled goal data
  React.useEffect(() => {
    if (prefilledGoal) {
      setSelectedCategory(prefilledGoal.category);
      setSelectedGoal(prefilledGoal.title);
      setDifficulty(prefilledGoal.difficulty);
      
      // Notify parent that prefilled goal has been used
      if (onPrefilledGoalUsed) {
        onPrefilledGoalUsed();
      }
    }
  }, [prefilledGoal, onPrefilledGoalUsed]);

  // Helper function to get unique difficulties for a category
  const getAvailableDifficulties = (category: string): string[] => {
    if (!categorizedGoals[category]) return [];
    const difficulties = categorizedGoals[category].map(goal => goal.difficulty);
    return [...new Set(difficulties)].sort((a, b) => {
      const order = { "very easy": 0, "easy": 1, "medium": 2, "hard": 3, "very hard": 4 };
      return (order[a as keyof typeof order] || 0) - (order[b as keyof typeof order] || 0);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoal) {
      onCreate({
        title: selectedGoal,
        difficulty: difficulty,
        category: selectedCategory,
        userId,
          confidenceBefore: confidenceBefore,
  expectedMistakes: expectedMistakes,
  MotivationRating: motivationRating
      });
      // Reset form fields
      setSelectedGoal("");
      setSelectedCategory("");
      setDifficulty("easy");
      setConfidenceBefore(3);
      setExpectedMistakes(3);
      setMotivationRating(3);
    }
  };

  return (
    <div 
      data-goal-form
      style={{
        background: "#229EBC",
        padding: "1rem",
        borderRadius: "10px",
        border: prefilledGoal ? "3px solid #4caf50" : "1px solid black",
        fontFamily: "'Comic Sans MS', cursive, sans-serif",
        color: "white",
        maxHeight: "80vh",
        overflowY: "auto",
        boxShadow: prefilledGoal ? "0 0 20px rgba(76, 175, 80, 0.5)" : "none"
      }}>
      <h3 style={{ 
        textAlign: "center", 
        marginBottom: "1rem",
        color: "white",
        fontSize: "1.1rem",
        fontWeight: "bold"
      }}>
        {prefilledGoal ? "✨ Quick Add Recommended Goal" : "🎯 Create Your Learning Goal"}
      </h3>
      
      {prefilledGoal && (
        <div style={{
          backgroundColor: "rgba(76, 175, 80, 0.2)",
          padding: "0.75rem",
          borderRadius: "8px",
          marginBottom: "1rem",
          border: "1px solid #4caf50",
          textAlign: "center"
        }}>
          <div style={{ fontSize: "0.9rem", color: "#e8f5e9", marginBottom: "0.25rem" }}>
            📌 <strong>Pre-filled from recommendation:</strong>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#c8e6c9" }}>
            <strong>{prefilledGoal.category}</strong> • {prefilledGoal.title} • {prefilledGoal.difficulty}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#a5d6a7", marginTop: "0.25rem" }}>
            Just fill in your self-efficacy questions below and click create!
          </div>
        </div>
      )}

      {/* 2x2 Grid Layout */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gridTemplateRows: "auto auto",
        gap: "1rem",
        maxWidth: "500px",
        margin: "0 auto"
      }}>

        {/* Step 1: Top Left - Choose Category */}
        <div style={{
          background: selectedCategory ? "#e8f5e8" : "#fff",
          padding: "0.8rem",
          borderRadius: "6px",
          border: "2px solid #333",
          color: "#333",
          minHeight: "120px"
        }}>
          <h4 style={{ 
            margin: "0 0 0.5rem 0", 
            color: "#333",
            fontSize: "0.85rem",
            fontWeight: "bold"
          }}>
            <span style={{ color: selectedCategory ? "#28a745" : "#007bff" }}>1.</span> Choose Category
          </h4>
          <select
            value={selectedCategory}
            onChange={(e) => {
              const newCategory = e.target.value;
              setSelectedCategory(newCategory);
              setSelectedGoal("");
              
              // Set the first available difficulty for the new category
              const availableDifficulties = getAvailableDifficulties(newCategory);
              if (availableDifficulties.length > 0) {
                setDifficulty(availableDifficulties[0]);
              }
            }}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "0.8rem",
              cursor: "pointer",
              backgroundColor: selectedCategory ? "#f8fff8" : "white"
            }}
          >
            <option value="">Select...</option>
            {Object.keys(categorizedGoals).map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          {selectedCategory && (
            <div style={{ 
              marginTop: "0.4rem", 
              fontSize: "0.7rem", 
              color: "#28a745",
              fontWeight: "bold"
            }}>
              ✓ Selected
            </div>
          )}
        </div>

        {/* Step 2: Top Right - Choose Difficulty */}
        <div style={{
          background: (selectedCategory && difficulty) ? "#e8f5e8" : selectedCategory ? "#fff" : "#f5f5f5",
          padding: "0.8rem",
          borderRadius: "6px",
          border: "2px solid #333",
          color: "#333",
          opacity: selectedCategory ? 1 : 0.6,
          minHeight: "120px"
        }}>
          <h4 style={{ 
            margin: "0 0 0.5rem 0", 
            color: "#333",
            fontSize: "0.85rem",
            fontWeight: "bold"
          }}>
            <span style={{ color: (selectedCategory && difficulty) ? "#28a745" : "#007bff" }}>2.</span> Difficulty
          </h4>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            disabled={!selectedCategory}
            style={{
              width: "100%",
              padding: "0.5rem",
              borderRadius: "4px",
              border: "1px solid #ccc",
              fontSize: "0.8rem",
              cursor: selectedCategory ? "pointer" : "not-allowed",
              backgroundColor: (selectedCategory && difficulty) ? "#f8fff8" : selectedCategory ? "white" : "#f0f0f0"
            }}
          >
            {selectedCategory && getAvailableDifficulties(selectedCategory).map(diff => {
              const difficultyEmojis: Record<string, string> = {
                "very easy": "🟦",
                "easy": "🟢", 
                "medium": "🟡",
                "hard": "🔴",
                "very hard": "⚫"
              };
              const difficultyLabels: Record<string, string> = {
                "very easy": "Very Easy",
                "easy": "Easy",
                "medium": "Medium", 
                "hard": "Hard",
                "very hard": "Very Hard"
              };
              return (
                <option key={diff} value={diff}>
                  {difficultyEmojis[diff]} {difficultyLabels[diff]}
                </option>
              );
            })}
          </select>
          {selectedCategory && difficulty && (
            <div style={{ 
              marginTop: "0.4rem", 
              fontSize: "0.7rem", 
              color: "#28a745",
              fontWeight: "bold"
            }}>
              ✓ Selected
            </div>
          )}
        </div>

        {/* Step 3: Bottom Left - Choose Subgoal */}
        <div style={{
          background: selectedGoal ? "#e8f5e8" : (selectedCategory && difficulty) ? "#fff" : "#f5f5f5",
          padding: "0.8rem",
          borderRadius: "6px",
          border: "2px solid #333",
          color: "#333",
          opacity: (selectedCategory && difficulty) ? 1 : 0.6,
          minHeight: "120px"
        }}>
          <h4 style={{ 
            margin: "0 0 0.5rem 0", 
            color: "#333",
            fontSize: "0.85rem",
            fontWeight: "bold"
          }}>
            <span style={{ color: selectedGoal ? "#28a745" : "#007bff" }}>3.</span> Subgoal
          </h4>
          
          {/* Goal options with completion guidance */}
          {selectedCategory && difficulty ? (
            <div style={{ marginBottom: "0.5rem" }}>
              {categorizedGoals[selectedCategory]
                .filter((g) => g.difficulty === difficulty)
                .map((goal, i) => (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.4rem",
                    padding: "0.4rem",
                    backgroundColor: selectedGoal === goal.title ? "#f0f8ff" : "#fafafa",
                    borderRadius: "4px",
                    border: selectedGoal === goal.title ? "2px solid #007bff" : "1px solid #ddd",
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedGoal(goal.title)}
                  >
                    <input
                      type="radio"
                      name="goalSelection"
                      value={goal.title}
                      checked={selectedGoal === goal.title}
                      onChange={() => setSelectedGoal(goal.title)}
                      style={{ marginRight: "0.5rem" }}
                    />
                    <div style={{ flex: 1, fontSize: "0.75rem", lineHeight: "1.2" }}>
                      {goal.title}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowGuidance(showGuidance === goal.title ? null : goal.title);
                      }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "0.9rem",
                        padding: "0.2rem",
                        borderRadius: "50%",
                        color: "#007bff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "20px",
                        height: "20px"
                      }}
                      title="How to complete this goal"
                    >
                      ℹ️
                    </button>
                  </div>
                ))}
            </div>
          ) : (
            <div style={{
              fontSize: "0.75rem",
              color: "#666",
              textAlign: "center",
              padding: "1rem 0"
            }}>
              {!selectedCategory ? "Choose a category first" : "Select difficulty level"}
            </div>
          )}

          {selectedGoal && (
            <div style={{ 
              marginTop: "0.4rem", 
              fontSize: "0.7rem", 
              color: "#28a745",
              fontWeight: "bold"
            }}>
              ✓ Selected
            </div>
          )}
        </div>

        {/* Step 4: Bottom Right - Self-Efficacy Questions */}
        <div style={{
          background: selectedGoal ? "#fff" : "#f5f5f5",
          padding: "0.8rem",
          borderRadius: "6px",
          border: "2px solid #333",
          color: "#333",
          opacity: selectedGoal ? 1 : 0.6,
          minHeight: "120px"
        }}>
          <h4 style={{ 
            margin: "0 0 0.5rem 0", 
            color: "#333",
            fontSize: "0.85rem",
            fontWeight: "bold"
          }}>
            <span style={{ color: "#007bff" }}>4.</span> Self-Efficacy
          </h4>
          
          {selectedGoal ? (
            <form onSubmit={handleSubmit} style={{ margin: 0 }}>
              {/* Confidence slider */}
              <div style={{ marginBottom: "0.5rem" }}>
                <label style={{ 
                  fontSize: "0.7rem", 
                  fontWeight: "bold", 
                  display: "block", 
                  marginBottom: "0.3rem",
                  color: "#333"
                }}>
                  Confidence? 🌟
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={confidenceBefore}
                  onChange={(e) => setConfidenceBefore(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
                <div style={{
                  fontSize: "1rem",
                  textAlign: "center",
                  marginTop: "0.2rem"
                }}>
                  {
                    {
                      1: "😟",
                      2: "🙁", 
                      3: "😐",
                      4: "🙂",
                      5: "😄",
                    }[confidenceBefore]
                  }
                </div>
              </div>

              {/* Expected Performance slider */}
              <div style={{ marginBottom: "0.5rem" }}>
                <label style={{ 
                  fontSize: "0.7rem", 
                  fontWeight: "bold", 
                  display: "block", 
                  marginBottom: "0.3rem",
                  color: "#333"
                }}>
                  Expected Mistakes? 🎯
                </label>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={1}
                  value={expectedMistakes}
                  onChange={(e) => setExpectedMistakes(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
                <div style={{
                  textAlign: "center",
                  marginTop: "0.2rem",
                  fontSize: "0.7rem",
                  fontWeight: "bold",
                  color: expectedMistakes <= 2 ? "#27ae60" : 
                        expectedMistakes <= 5 ? "#f39c12" : "#e74c3c"
                }}>
                  {expectedMistakes} mistakes
                </div>
              </div>

              {/* Motivation Rating slider */}
              <div style={{ marginBottom: "0.5rem" }}>
                <label style={{ 
                  fontSize: "0.7rem", 
                  fontWeight: "bold", 
                  display: "block", 
                  marginBottom: "0.3rem",
                  color: "#333"
                }}>
             How committed are you to achieving your goal? 🔥
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={motivationRating}
                  onChange={(e) => setMotivationRating(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
                <div style={{
                  fontSize: "1rem",
                  textAlign: "center",
                  marginTop: "0.2rem"
                }}>
                  {
                    {
                      1: "😴",
                      2: "😕", 
                      3: "😐",
                      4: "😊",
                      5: "🔥",
                    }[motivationRating]
                  }
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                style={{
                  width: "100%",
                  padding: "0.5rem",
                  background: "#28a745",
                  color: "#fff",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.8rem",
                }}
              >
                ✅ Create Goal
              </button>
            </form>
          ) : (
            <div style={{ 
              textAlign: "center", 
              color: "#666",
              fontSize: "0.7rem",
              marginTop: "0.5rem"
            }}>
              Complete steps 1-3 first
            </div>
          )}
        </div>

      </div>

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
    </div>
  );
}
