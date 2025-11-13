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
  "Learn what linear equations are": "✅ What to do:\nStart any Flexibility Exercise\n\n📚 Exercises you can choose:\n• Suitability Exercise\n• Efficiency Exercise\n• Matching Exercise\n\n✓ Completes automatically on first exercise",
  
  "Understand how substitution works": "✅ What to do:\nComplete 1 exercise using Substitution method\n\n📚 Exercises you can choose:\n• Exercise #2 (Efficiency)\n• Exercise #9 (Matching)\n• Exercise #5 (Sutaiblity)",
  
  "Understand how elimination works": "✅ What to do:\nComplete 1 exercise using Elimination method\n\n📚 Exercises you can choose:\n• Exercise #6 (Efficiency)\n• Exercise #7 (Matching)\n• Exercise #3 (Suitability)",

  "Understand how equalization works": "✅ What to do:\nComplete 1 exercise using Equalization method\n\n📚 Exercises you can choose:\n• Exercise #1 (Suitability)\n• Exercise #2 (Matching)\n• Exercise #4 (Matching)",

  // Method Mastery (5 goals)
  "Master substitution/equalization/elimination method": "✅ What to do:\nComplete 2 exercises using Substitution, Equalization, OR Elimination method\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise  in the Training Flexibility module \n•Pick two exercises that use the same method twice",
  
  "Practice with different methods": "✅ What to do:\nComplete 2 exercises using 2 DIFFERENT methods\n\nExample: 1 Substitution + 1 Elimination\n\n📚 Exercises you can choose:\n• Pick two exercises that use different methods",
  
  "Switch methods strategically": "✅ What to do:\nComplete 3 exercises using a DIFFERENT method each time\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise\n• Use all 3 methods (Substitution, Elimination, Equalization) in any of the exercises",
  
  "Choose optimal methods consistently": "✅ What to do:\nComplete 3 Efficiency Exercises\n\n📚 Exercises you can choose:\n• Any Efficiency Exercise",

  "Master all three methods fluently": "✅ What to do:\nComplete atleast 2 exercises using EACH method\n\nMeans: 2 Substitution + 2 Elimination + 2 Equalization = 6 exercises total\n\n📚 Exercises you can choose:\n• Substitution: Exercise #2, #9\n• Elimination: Exercise #6, #7\n• Equalization: Exercise #1, #13",

  // Problem Solving (5 goals)
  "Complete exercises without hints": "✅ What to do:\nComplete 1 exercise using 0 hints\n\n📚 Exercises you can choose:\n• Any Exercise",
  
  "Solve problems with minimal errors": "✅ What to do:\nComplete 1 exercise with 1 or fewer errors\n\n📚 Exercises you can choose:\n• Any Exercise",
  
  "Handle complex problems confidently": "✅ What to do:\nComplete 5 exercises total\n\n📚 Exercises you can choose:\n• Any Exercise\n• Any method",
  
  "Show exceptional problem-solving": "✅ What to do:\nComplete 1 exercise with 0 errors AND 0 hints\n\n📚 Exercises you can choose:\n• Any Exercise",

  "Maintain accuracy under pressure": "✅ What to do:\nComplete 5+ exercises with average of 1 error or less\n\nExample: If you do 5 exercises, you can make max 5 total errors\n\n📚 Exercises you can choose:\n• Any Exercise",

  // Learning & Growth (5 goals)  
  "Build confidence through success": "✅ What to do:\nComplete 1 exercise using 2 or fewer hints\n\n📚 Exercises you can choose:\n• Any  Exercise",
  
  "Develop problem-solving resilience": "✅ What to do:\nComplete 1 exercise even if you make errors\n\nMake at least 1 error, then finish the exercise\n\n📚 Exercises you can choose:\n• Any  Exercise",

  "Learn from mistakes effectively": "✅ What to do:\nThe system automatically tracks your improvement\nTry to make fewer errors in recent exercises than earlier ones\n\n📚 Exercises you can choose:\n• Any Exercise",

  "Set personal learning challenges": "✅ What to do:\nComplete 10 exercises in total\n\n📚 Exercises you can choose:\n• Any Exercise\n• Any method",

  "Reflect on method effectiveness": "✅ What to do:\nComplete 1 exercise with self-explanation\n\n📚 Exercises you can choose:\n•Any Matching Exercise\n• Any Efficiency Exercise",

  "Explain reasoning clearly": "✅ What to do:\nComplete 3 exercises with self-explanation\n\n📚 Exercises you can choose:\n• Any Matching Exercise\n• Any Efficiency Exercise",

  "Show consistent improvement": "✅ What to do:\n The system automatically tracks your improvement\nTry to complete 4 exercises with fewer errors each time\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise\n• System tracks improvement automatically",

  "Work independently": "✅ What to do:\nComplete 3 exercises without using hints\n\n📚 Exercises you can choose:\n• Any Flexibility Exercise"
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
    </div>
  );
}
