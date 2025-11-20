// src/components/GoalListOverlay.tsx
import React, { useState, useEffect } from "react";
import { Goal, GoalInput } from "@/types/goal";
import { updateGoal, deleteGoal, logReason } from "@/utils/api";
import ReasonPrompt from "./ReasonPrompt";
import AgentPopup from "./PedologicalAgent";
import FemaleAfricanSmiling from "@images/flexibility/Agent 3.png";

interface GoalListOverlayProps {
  goals: Goal[];
  onClose: () => void;
  userId: number;
  onGoalsChange: (goals: Goal[]) => void;
}

// Helper function for difficulty colors (matching GoalForm colors)
const getDifficultyColor = (difficulty: string) => {
  switch (difficulty.toLowerCase()) {
    case 'very easy': return '#4caf50';
    case 'easy': return '#8bc34a';
    case 'medium': return '#ffc107';
    case 'hard': return '#ff9800';
    case 'very hard': return '#f44336';
    default: return '#9e9e9e';
  }
};

// Categorized goals data (from GoalList.tsx)
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
  ],
};

// Goal completion guide (copied from GoalList.tsx)
const goalCompletionGuide: { [key: string]: string } = {
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

export default function GoalListOverlay({ goals, onClose, userId, onGoalsChange }: GoalListOverlayProps) {
  // State for edit functionality (matching GoalList.tsx)
  const [editingGoalId, setEditingGoalId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("");
  const [editCategory, setEditCategory] = useState<string>("");
  const [editConfidenceBefore, setEditConfidenceBefore] = useState<number>(3);
  const [editExpectedMistakes, setEditExpectedMistakes] = useState<number>(3);
  const [editMotivationRating, setEditMotivationRating] = useState<number>(3);
  const [showEditModal, setShowEditModal] = useState(false);
  
  // State for info/guidance modal
  const [showGuidanceModal, setShowGuidanceModal] = useState<string | null>(null);
  
  // State for reason prompt (delete/update confirmation)
  const [reasonPrompt, setReasonPrompt] = useState<{ goalId: number; action: string } | null>(null);
  
  // Agent message system (from GoalList.tsx)
  const [agentMessage, setAgentMessage] = useState<{ text: string; duration?: number } | null>(null);
  const [showCheckIn, setShowCheckIn] = useState(false);

  // Edit functionality
  function startEditing(goal: Goal) {
    setEditingGoalId(goal.id);
    setEditTitle(goal.title);
    setEditDifficulty(goal.difficulty);
    setEditCategory(goal.category || "");
    setEditConfidenceBefore(goal.confidenceBefore || 3);
    setEditExpectedMistakes(goal.expectedMistakes || 3);
    setEditMotivationRating(goal.MotivationRating || 3);
    setShowEditModal(true);
  }

  function cancelEditing() {
    setEditingGoalId(null);
    setShowEditModal(false);
  }

  async function saveEdit() {
    if (editingGoalId === null) return;

    try {
      const updatedGoalInput: GoalInput = {
        title: editTitle,
        difficulty: editDifficulty,
        category: editCategory,
        userId: goals.find((g) => g.id === editingGoalId)?.userId || userId,
        confidenceBefore: editConfidenceBefore,
        expectedMistakes: editExpectedMistakes,
        MotivationRating: editMotivationRating,
      };

      await updateGoal(editingGoalId, updatedGoalInput);

      const updatedGoals = goals.map((g) =>
        g.id === editingGoalId
          ? {
              ...g,
              title: editTitle,
              difficulty: editDifficulty,
              category: editCategory,
              confidenceBefore: editConfidenceBefore,
              expectedMistakes: editExpectedMistakes,
              MotivationRating: editMotivationRating,
            }
          : g
      );

      onGoalsChange(updatedGoals);
      setEditingGoalId(null);
      setShowEditModal(false);
      
      // Show agent message for edit (from GoalList.tsx)
      setAgentMessage({
        text: "👍 Great! Changing goals is okay — just remember why you made the switch!",
        duration: 4000
      });
      setShowCheckIn(true);
      
      // Set reason prompt for logging why they updated
      setReasonPrompt({ goalId: editingGoalId, action: "Update" });
    } catch (error) {
      console.error("Failed to update goal", error);
    }
  }

  // Delete functionality
  async function removeGoal(id: number) {
    try {
      setReasonPrompt({ goalId: id, action: "Delete" });
    } catch (error) {
      console.error("Failed to initiate goal deletion", error);
    }
  }

  // Handle reason prompt submission
  async function handleReasonSubmit(reason: string) {
    if (!reasonPrompt) return;

    try {
      await logReason(reasonPrompt.goalId, reasonPrompt.action, reason);

      if (reasonPrompt.action === "Delete") {
        await deleteGoal(reasonPrompt.goalId);
        const updatedGoals = goals.filter(g => g.id !== reasonPrompt.goalId);
        onGoalsChange(updatedGoals);
        
        // Show agent message for delete (from GoalList.tsx)
        setAgentMessage({
          text: "🗑️ It's okay to remove goals if they feel too much, just remember to complete what you have!",
          duration: 4000
        });
        setShowCheckIn(true);
      }

      setReasonPrompt(null);
    } catch (error) {
      console.error(`Failed to ${reasonPrompt.action.toLowerCase()} goal:`, error);
      setReasonPrompt(null);
    }
  }
  return (
    <>
      <div style={{
        position: "fixed",
        top: "20px",
        right: "20px",
        width: "380px",
        maxHeight: "500px",
        backgroundColor: "white",
        boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
        zIndex: 2000,
        borderRadius: "10px",
        border: "3px solid #229EBC",
        overflow: "hidden",
        fontFamily: "'Comic Sans MS', cursive, sans-serif"
      }}>
        {/* Header Section */}
        <div style={{
          backgroundColor: "#229EBC",
          padding: "0.8rem 1rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <h3 style={{ 
            color: "white", 
            margin: 0, 
            fontSize: "1rem",
            fontWeight: "bold"
          }}>
            🎯 Your Active Goals
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.2)",
              border: "none",
              fontSize: "1.1rem",
              cursor: "pointer",
              color: "white",
              padding: "0.3rem",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s"
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.3)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.2)")}
          >
            ✕
          </button>
        </div>

        {/* Goals Content Section */}
        <div style={{
          padding: "0.8rem",
          maxHeight: "420px",
          overflowY: "auto",
          backgroundColor: "#f8f9fa"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "6px",
            border: "2px solid #000",
            padding: "0.8rem",
            marginBottom: "0.5rem"
          }}>
            <h4 style={{ 
              color: "#1976d2", 
              margin: "0 0 0.8rem 0",
              fontSize: "0.9rem",
              fontWeight: "600",
              textAlign: "center"
            }}>
              🎯 Your Active Goals ({goals.filter(g => !g.completed).length})
            </h4>
            
            {goals.filter(g => !g.completed).length === 0 ? (
              <div style={{
                textAlign: "center",
                color: "#666",
                fontStyle: "italic",
                padding: "1.5rem",
                fontSize: "0.8rem"
              }}>
                No active goals. Create some goals to get started!
              </div>
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.6rem"
              }}>
                {goals.filter(g => !g.completed).map((goal) => (
                  <div
                    key={goal.id}
                    style={{
                      padding: "0.6rem",
                      backgroundColor: "white",
                      borderRadius: "5px",
                      border: "2px solid #e0e0e0",
                      boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                      transition: "all 0.3s ease",
                      cursor: "pointer"
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "#229EBC";
                      e.currentTarget.style.boxShadow = "0 2px 6px rgba(34, 158, 188, 0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "#e0e0e0";
                      e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.05)";
                    }}
                  >
                    <div style={{ 
                      fontWeight: "600", 
                      marginBottom: "0.4rem",
                      color: "#333",
                      fontSize: "0.8rem",
                      lineHeight: "1.3"
                    }}>
                      {goal.title}
                    </div>
                    
                    {goal.category && (
                      <div style={{ 
                        fontSize: "0.7rem",
                        color: "#229EBC",
                        textTransform: "uppercase",
                        letterSpacing: "0.3px",
                        marginBottom: "0.4rem",
                        fontWeight: "500"
                      }}>
                        {goal.category}
                      </div>
                    )}
                    
                    {goal.difficulty && (
                      <div style={{ 
                        fontSize: "0.7rem",
                        color: getDifficultyColor(goal.difficulty),
                        fontWeight: "500",
                        marginBottom: "0.5rem"
                      }}>
                        📊 {goal.difficulty.charAt(0).toUpperCase() + goal.difficulty.slice(1)}
                      </div>
                    )}

                    {/* Action buttons with proper names */}
                    <div style={{
                      display: "flex",
                      gap: "0.3rem",
                      marginTop: "0.5rem",
                      flexWrap: "wrap"
                    }}>
                      <button
                        onClick={() => startEditing(goal)}
                        style={{
                          padding: "0.3rem 0.5rem",
                          background: "#ffc107",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "0.65rem",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#e0a800")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#ffc107")}
                        title={`Edit goal: ${goal.title}`}
                      >
                        ✏️ Edit
                      </button>

                      <button
                        onClick={() => removeGoal(goal.id)}
                        style={{
                          padding: "0.3rem 0.5rem",
                          background: "#dc3545",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "0.65rem",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#c82333")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#dc3545")}
                        title={`Delete goal: ${goal.title}`}
                      >
                        🗑️ Delete
                      </button>

                      <button
                        onClick={() => setShowGuidanceModal(goal.title)}
                        style={{
                          padding: "0.3rem 0.5rem",
                          background: "#17a2b8",
                          color: "white",
                          border: "none",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontWeight: "600",
                          fontSize: "0.65rem",
                          transition: "all 0.2s ease"
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = "#138496")}
                        onMouseLeave={(e) => (e.currentTarget.style.background = "#17a2b8")}
                        title={`View completion guide for: ${goal.title}`}
                      >
                        💡 Guide
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agent popup (from GoalList.tsx) */}
      {showCheckIn && agentMessage && (
        <AgentPopup
          message={agentMessage.text}
          image={FemaleAfricanSmiling}
          onClose={() => {
            setShowCheckIn(false);
            setAgentMessage(null);
          }}
          duration={agentMessage.duration || 4000}
        />
      )}

      {/* Edit Goal Modal - Using sophisticated modal from GoalList.tsx */}
      {showEditModal && (
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
          zIndex: 2000,
          fontFamily: "'Comic Sans MS', cursive, sans-serif"
        }}
        onClick={cancelEditing}
        >
          <div style={{
            backgroundColor: "#229EBC",
            padding: "1.5rem",
            borderRadius: "12px",
            maxWidth: "600px",
            width: "90%",
            maxHeight: "90vh",
            overflowY: "auto",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "3px solid #000"
          }}
          onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem"
            }}>
              <h3 style={{
                margin: 0,
                color: "white",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}>
                ✏️ Edit Your Goal
              </h3>
              <button
                onClick={cancelEditing}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "white",
                  padding: "0.2rem"
                }}
              >
                ✕
              </button>
            </div>

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

            {/* Self-Efficacy Questions - Similar to GoalForm */}
            <div style={{
              background: "white",
              padding: "1rem",
              borderRadius: "8px",
              border: "2px solid #333",
              color: "#333"
            }}>
              <h4 style={{ 
                margin: "0 0 0.75rem 0", 
                color: "#333",
                fontSize: "0.9rem",
                fontWeight: "bold",
                textAlign: "center"
              }}>
                📊 Self-Efficacy Questions
              </h4>

              {/* Confidence */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ 
                  fontSize: "0.75rem", 
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
                  value={editConfidenceBefore}
                  onChange={(e) => setEditConfidenceBefore(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
                <div style={{
                  fontSize: "1.2rem",
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
                    }[editConfidenceBefore]
                  }
                </div>
              </div>

              {/* Expected Mistakes */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: "bold", 
                  display: "block", 
                  marginBottom: "0.3rem",
                  color: "#333"
                }}>
                  Expected Mistakes? 🎯
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={editExpectedMistakes}
                  onChange={(e) => setEditExpectedMistakes(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
                <div style={{
                  fontSize: "1.2rem",
                  textAlign: "center",
                  marginTop: "0.2rem"
                }}>
                  {
                    {
                      1: "😎",
                      2: "🙂",
                      3: "😐",
                      4: "😅",
                      5: "😰",
                    }[editExpectedMistakes]
                  }
                </div>
              </div>

              {/* Motivation */}
              <div style={{ marginBottom: "0.75rem" }}>
                <label style={{ 
                  fontSize: "0.75rem", 
                  fontWeight: "bold", 
                  display: "block", 
                  marginBottom: "0.3rem",
                  color: "#333"
                }}>
                  Motivation? 🔥
                </label>
                <input
                  type="range"
                  min={1}
                  max={5}
                  step={1}
                  value={editMotivationRating}
                  onChange={(e) => setEditMotivationRating(Number(e.target.value))}
                  style={{
                    width: "100%",
                    cursor: "pointer",
                  }}
                />
                <div style={{
                  fontSize: "1.2rem",
                  textAlign: "center",
                  marginTop: "0.2rem"
                }}>
                  {
                    {
                      1: "😴",
                      2: "😐",
                      3: "🙂",
                      4: "😊",
                      5: "🔥",
                    }[editMotivationRating]
                  }
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "1rem",
              gap: "1rem"
            }}>
              <button
                onClick={cancelEditing}
                style={{
                  background: "#6c757d",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  fontFamily: "'Comic Sans MS', cursive, sans-serif"
                }}
              >
                ❌ Cancel
              </button>
              
              <button
                onClick={saveEdit}
                disabled={!editTitle || !editCategory || !editDifficulty}
                style={{
                  background: (editTitle && editCategory && editDifficulty) ? "#28a745" : "#ccc",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  cursor: (editTitle && editCategory && editDifficulty) ? "pointer" : "not-allowed",
                  fontSize: "0.9rem",
                  fontWeight: "bold",
                  fontFamily: "'Comic Sans MS', cursive, sans-serif"
                }}
              >
                ✅ Save Goal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guidance Modal */}
      {showGuidanceModal && (
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
          zIndex: 3000
        }}>
          <div style={{
            background: "white",
            padding: "2rem",
            borderRadius: "8px",
            width: "90%",
            maxWidth: "600px",
            maxHeight: "80vh",
            overflowY: "auto"
          }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem"
            }}>
              <h3 style={{ margin: 0, color: "#333" }}>
                How to Complete: "{showGuidanceModal}"
              </h3>
              <button
                onClick={() => setShowGuidanceModal(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#666"
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              color: "#333",
              lineHeight: "1.6",
              whiteSpace: "pre-line"
            }}>
              {goalCompletionGuide[showGuidanceModal] || "Completion guidance not available for this goal."}
            </div>
            
            <div style={{ textAlign: "right", marginTop: "1.5rem" }}>
              <button
                onClick={() => setShowGuidanceModal(null)}
                style={{
                  padding: "0.5rem 1rem",
                  background: "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer"
                }}
              >
                Got it!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reason Prompt Modal */}
      {reasonPrompt && (
        <ReasonPrompt
          title={`Why did you ${reasonPrompt.action.toLowerCase()} this goal?`}
          placeholder="Explain your reason..."
          onSubmit={handleReasonSubmit}
          onCancel={() => setReasonPrompt(null)}
        />
      )}
    </>
  );
}
