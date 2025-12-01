import React, { useState } from "react";
import { GoalInput } from "@/types/goal";
import { useTranslation } from "react-i18next";
import { TranslationNamespaces } from "@/i18n";
import { 
  goalTitleToKey, 
  categoryToKey, 
  difficultyToKey,
  categorizedGoalsKeys,
  getEnglishTitle,
  getCategoryKey
} from "@/utils/goalTranslations";

interface Props {
  onCreate: (goal: GoalInput) => void;
  userId: number;
  prefilledGoal?: {category: string, title: string, difficulty: string} | null;
  onPrefilledGoalUsed?: () => void;
}

// Goal completion guidance - now uses translation keys
// Guide text is fetched from translation files via t(`goal-desc-${key}`)

// Goals structure - translations handled dynamically
// Actual titles/descriptions come from translation files

export function GoalForm({ onCreate, userId, prefilledGoal, onPrefilledGoalUsed }: Props) {
  const { t } = useTranslation(TranslationNamespaces.GoalSetting);
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
      // Convert English names to translation keys
      const categoryKey = getCategoryKey(prefilledGoal.category);
      const goalKey = goalTitleToKey[prefilledGoal.title];
      
      setSelectedCategory(categoryKey);
      setSelectedGoal(goalKey);
      setDifficulty(prefilledGoal.difficulty);
      
      // Notify parent that prefilled goal has been used
      if (onPrefilledGoalUsed) {
        onPrefilledGoalUsed();
      }
    }
  }, [prefilledGoal, onPrefilledGoalUsed]);

  // Helper function to get goals for a category (returns translation keys and difficulty)
  const getGoalsForCategory = (categoryKey: string) => {
    return categorizedGoalsKeys[categoryKey] || [];
  };

  // Helper function to get unique difficulties for a category
  const getAvailableDifficulties = (categoryKey: string): string[] => {
    const goals = getGoalsForCategory(categoryKey);
    if (goals.length === 0) return [];
    const difficulties = goals.map(goal => goal.difficulty);
    return ([...new Set(difficulties)] as string[]).sort((a, b) => {
      const order: Record<string, number> = { "very-easy": 0, "easy": 1, "medium": 2, "hard": 3, "very-hard": 4 };
      return (order[a] || 0) - (order[b] || 0);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoal) {
      // Convert translation keys back to English for API
      const englishTitle = getEnglishTitle(selectedGoal);
      const englishCategory = t(`categories.${selectedCategory}`, { lng: 'en' }); // Get English category
      onCreate({
        title: englishTitle,
        difficulty: difficulty,
        category: englishCategory,
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
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
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
        {prefilledGoal ? `✨ ${t('ui.set-goal')}` : `🎯 ${t('ui.set-goal')}`}
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
            <strong>{t('prefilled-form.title')}</strong>
          </div>
          <div style={{ fontSize: "0.8rem", color: "#c8e6c9" }}>
            <strong>{t(`categories.${getCategoryKey(prefilledGoal.category)}`)}</strong> • {t(`goal-titles.${goalTitleToKey[prefilledGoal.title]}`)} • {t(`ui.${prefilledGoal.difficulty.toLowerCase()}`)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#a5d6a7", marginTop: "0.25rem" }}>
            {t('prefilled-form.instruction')}
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
            <span style={{ color: selectedCategory ? "#28a745" : "#007bff" }}>1.</span> {t('ui.select-category')}
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
            <option value="">{t('placeholders.select-category')}</option>
            {Object.keys(categorizedGoalsKeys).map((catKey) => (
              <option key={catKey} value={catKey}>
                {t(`categories.${catKey}`)}
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
            <span style={{ color: (selectedCategory && difficulty) ? "#28a745" : "#007bff" }}>2.</span> {t('ui.difficulty-level')}
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
                "very-easy": "🟦",
                "easy": "🟢", 
                "medium": "🟡",
                "hard": "🔴",
                "very-hard": "⚫"
              };
              return (
                <option key={diff} value={diff}>
                  {difficultyEmojis[diff]} {t(`difficulty.${diff}`)}
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
            <span style={{ color: selectedGoal ? "#28a745" : "#007bff" }}>3.</span> {t('ui.select-goal')}
          </h4>
          
          {/* Goal options with completion guidance */}
          {selectedCategory && difficulty ? (
            <div style={{ marginBottom: "0.5rem" }}>
              {getGoalsForCategory(selectedCategory)
                .filter((g) => g.difficulty === difficulty)
                .map((goal, i) => (
                  <div key={i} style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "0.4rem",
                    padding: "0.4rem",
                    backgroundColor: selectedGoal === goal.key ? "#f0f8ff" : "#fafafa",
                    borderRadius: "4px",
                    border: selectedGoal === goal.key ? "2px solid #007bff" : "1px solid #ddd",
                    cursor: "pointer"
                  }}
                  onClick={() => setSelectedGoal(goal.key)}
                  >
                    <input
                      type="radio"
                      name="goalSelection"
                      value={goal.key}
                      checked={selectedGoal === goal.key}
                      onChange={() => setSelectedGoal(goal.key)}
                      style={{ marginRight: "0.5rem" }}
                    />
                    <div style={{ flex: 1, fontSize: "0.75rem", lineHeight: "1.2" }}>
                      {t(`goal-titles.${goal.key}`)}
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
              {!selectedCategory ? t('ui.select-category') : t('ui.select-goal')}
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
            <span style={{ color: "#007bff" }}>4.</span> {t('pre-goal-assessment.title')}
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
                  {t('pre-goal-assessment.confidence-question').split(' ').slice(0, 3).join(' ')}? 🌟
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
                  {t('pre-goal-assessment.mistakes-question').split(' ').slice(0, 3).join(' ')}? 🎯
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
             {t('pre-goal-assessment.motivation-question')} 🔥
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
                ✅ {t('ui.set-goal')}
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
          zIndex: 1000
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
                🎯 {t('goal-completion-guide.title')}
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
                "{t(`goal-titles.${showGuidance}`)}"
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
                {t(`goal-descriptions.${showGuidance}`) || t('errors-and-validation.goal-not-found')}
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
                  fontSize: "0.9rem"
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
