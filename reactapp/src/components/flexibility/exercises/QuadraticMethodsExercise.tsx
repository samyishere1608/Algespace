import React, { useState } from "react";
import { useGoalCompletion } from "@/contexts/GoalCompletionContext";
import { useNavigate } from "react-router-dom";
import NavigationBar from "@components/shared/NavigationBar.tsx";
import { Paths } from "@routes/paths.ts";
import { useCustomExercise } from "@/hooks/useCustomExercise";
import "@styles/flexibility/flexibility.scss";

interface QuadraticMethod {
  name: string;
  description: string;
  example: string;
  bestFor: string[];
  difficulty: "easy" | "medium" | "hard";
}

interface Props {
  onComplete: () => void;
}

const quadraticMethods: QuadraticMethod[] = [
  {
    name: "Factoring",
    description: "Factor the quadratic into two binomials: (ax + b)(cx + d) = 0",
    example: "x² - 5x + 6 = 0 → (x - 2)(x - 3) = 0",
    bestFor: ["Integer solutions", "Perfect square trinomials", "Simple coefficients"],
    difficulty: "easy"
  },
  {
    name: "Quadratic Formula",
    description: "Use the formula: x = (-b ± √(b² - 4ac)) / 2a",
    example: "x² + 3x + 1 = 0 → x = (-3 ± √(9-4)) / 2 = (-3 ± √5) / 2",
    bestFor: ["Any quadratic equation", "Non-integer solutions", "When factoring is difficult"],
    difficulty: "medium"
  },
  {
    name: "Completing the Square",
    description: "Rewrite as (x + h)² = k and solve",
    example: "x² + 6x + 5 = 0 → (x + 3)² - 9 + 5 = 0 → (x + 3)² = 4",
    bestFor: ["Converting to vertex form", "Understanding parabola properties", "Deriving quadratic formula"],
    difficulty: "hard"
  }
];

const practiceProblems = [
  {
    equation: "x² - 4x + 4 = 0",
    bestMethod: "Factoring",
    reason: "Perfect square trinomial - factors easily as (x - 2)²"
  },
  {
    equation: "2x² + 3x - 1 = 0", 
    bestMethod: "Quadratic Formula",
    reason: "Doesn't factor nicely with integer coefficients"
  },
  {
    equation: "x² + 8x + 10 = 0",
    bestMethod: "Completing the Square", 
    reason: "Good for showing the relationship to vertex form"
  }
];

export function QuadraticMethodsExercise({ onComplete }: Props): React.ReactElement {
  const [selectedMethod, setSelectedMethod] = useState<string>("");
  const [currentProblem, setCurrentProblem] = useState(0);
  const [selfExplanation, setSelfExplanation] = useState("");
  const [phase, setPhase] = useState<"selection" | "explanation" | "feedback">("selection");
  
  const { completeGoalByTitle } = useGoalCompletion();
  const navigate = useNavigate();
  
  // Track exercise completion in database
  const { completeExercise } = useCustomExercise({
    userId: 1, // TODO: Get from user context
    exerciseId: 15, // Unique ID for QuadraticMethods exercise
    exerciseName: "Quadratic Methods Exercise",
    exerciseType: "flexibility"
  });
  
  const currentProb = practiceProblems[currentProblem];

  const handleMethodSelect = (methodName: string) => {
    setSelectedMethod(methodName);
  };

  const handleSelfExplanationSubmit = () => {
    if (selfExplanation.trim()) {
      setPhase("feedback");
      
      // Complete relevant goals based on method chosen
      if (selectedMethod === "Factoring") {
        completeGoalByTitle("Learn basic factoring techniques");
        completeGoalByTitle("Complete a guided example");
      } else if (selectedMethod === "Quadratic Formula") {
        completeGoalByTitle("Practice using the quadratic formula");
        completeGoalByTitle("Try each method once");
      } else if (selectedMethod === "Completing the Square") {
        completeGoalByTitle("Master completing the square method");
        completeGoalByTitle("Choose optimal method for each problem");
      }
      
      // Complete reflection goals
      completeGoalByTitle("Reflect on why a method worked");
      completeGoalByTitle("Notice what worked well");
    }
  };

  const continueAfterFeedback = async () => {
    if (currentProblem < practiceProblems.length - 1) {
      setCurrentProblem(currentProblem + 1);
      setSelectedMethod("");
      setSelfExplanation("");
      setPhase("selection");
    } else {
      // Complete final goals
      completeGoalByTitle("Solve any quadratic equation efficiently");
      completeGoalByTitle("Analyze and improve my problem-solving approach");
      
      // Save completion to database with summary data
      const completionData = {
        totalProblems: practiceProblems.length,
        completedAt: new Date().toISOString(),
        finalMethod: selectedMethod,
        exerciseType: "quadratic-methods"
      };
      
      try {
        await completeExercise(completionData);
      } catch (error) {
        console.error('Failed to save exercise completion:', error);
        // Continue even if database save fails
      }
      
      onComplete();
    }
  };

  return (
    <>
      <NavigationBar 
        mainRoute="Flexibility"
        subRoute="Exercise 15"
        handleSelection={(isHome: boolean) => {
          if (isHome) {
            navigate("/");
          } else {
            navigate(Paths.FlexibilityPath);
          }
        }}
        currentExercise={15}
        exercisesCount={15}
      />
      
      <div className="flexibility-view__container" style={{
        background: "linear-gradient(135deg, #013047 0%, #013047 100%)",
        minHeight: "100vh"
      }}>
        <div className="flexibility-view__contents">
          <div style={{
            background: "rgba(255, 255, 255, 0.1)",
            color: "white",
            padding: "1.5rem",
            borderRadius: "12px",
            marginBottom: "2rem",
            textAlign: "center",
            width: "100%",
            border: "1px solid rgba(255, 255, 255, 0.2)"
          }}>
            <h1 style={{ margin: "0 0 0.5rem 0", fontSize: "2rem" }}>
              🔢 Quadratic Methods Exercise
            </h1>
            <p style={{ margin: 0, fontSize: "1.1rem", opacity: 0.9 }}>
              Problem {currentProblem + 1} of {practiceProblems.length}: Choose the best method to solve this quadratic equation
            </p>
          </div>

          {phase === "selection" && (
            <div>
              <div style={{
                background: "rgba(255, 255, 255, 0.95)",
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "2rem",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}>
                <h2 style={{ color: "#333", marginBottom: "1rem", fontSize: "1.5rem" }}>
                  Solve: <span style={{ color: "#007bff", fontSize: "1.3em" }}>{currentProb.equation}</span>
                </h2>
                <p style={{ color: "#666", fontSize: "1rem" }}>
                  Which method would you choose to solve this quadratic equation?
                </p>
              </div>

              <div style={{ display: "grid", gap: "1rem" }}>
                {quadraticMethods.map((method, index) => (
                  <div
                    key={index}
                    onClick={() => handleMethodSelect(method.name)}
                    style={{
                      border: `2px solid ${selectedMethod === method.name ? "#ffffff" : "rgba(255, 255, 255, 0.3)"}`,
                      borderRadius: "8px",
                      padding: "1.5rem",
                      cursor: "pointer",
                      background: selectedMethod === method.name ? "rgba(255, 255, 255, 0.95)" : "rgba(255, 255, 255, 0.85)",
                      transition: "all 0.3s ease",
                      boxShadow: selectedMethod === method.name ? "0 4px 12px rgba(0,123,255,0.2)" : "0 2px 4px rgba(0,0,0,0.1)"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                      <h3 style={{ margin: 0, color: "#495057", fontSize: "1.3rem" }}>
                        {method.name}
                      </h3>
                      <span style={{
                        background: method.difficulty === "easy" ? "#28a745" : method.difficulty === "medium" ? "#ffc107" : "#dc3545",
                        color: "white",
                        padding: "0.25rem 0.75rem",
                        borderRadius: "20px",
                        fontSize: "0.8rem",
                        fontWeight: "600"
                      }}>
                        {method.difficulty.toUpperCase()}
                      </span>
                    </div>
                    
                    <p style={{ margin: "0 0 1rem 0", color: "#6c757d", lineHeight: "1.5" }}>
                      {method.description}
                    </p>
                    
                    <div style={{
                      background: "rgba(248, 249, 250, 0.8)",
                      padding: "1rem",
                      borderRadius: "6px",
                      marginBottom: "1rem",
                      border: "1px solid rgba(233, 236, 239, 0.5)"
                    }}>
                      <strong style={{ color: "#495057" }}>Example:</strong>
                      <div style={{ fontFamily: "monospace", color: "#007bff", marginTop: "0.5rem" }}>
                        {method.example}
                      </div>
                    </div>
                    
                    <div>
                      <strong style={{ color: "#495057" }}>Best for:</strong>
                      <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.2rem", color: "#6c757d" }}>
                        {method.bestFor.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>

              {selectedMethod && (
                <div style={{ marginTop: "2rem", textAlign: "center" }}>
                  <button
                    onClick={() => setPhase("explanation")}
                    style={{
                      background: "#007bff",
                      color: "white",
                      border: "none",
                      padding: "1rem 2rem",
                      borderRadius: "8px",
                      fontSize: "1.1rem",
                      fontWeight: "600",
                      cursor: "pointer",
                      transition: "background-color 0.3s ease"
                    }}
                  >
                    Continue with {selectedMethod} →
                  </button>
                </div>
              )}
            </div>
          )}

          {phase === "explanation" && (
            <div>
              <div style={{
                background: "rgba(227, 242, 253, 0.95)",
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "2rem",
                border: "2px solid rgba(33, 150, 243, 0.6)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}>
                <h2 style={{ color: "#1565c0", marginBottom: "1rem" }}>
                  You chose: {selectedMethod}
                </h2>
                <p style={{ color: "#1976d2", fontSize: "1rem", margin: 0 }}>
                  Now explain why you think this method is good for solving: <strong>{currentProb.equation}</strong>
                </p>
              </div>

              <div style={{ marginBottom: "2rem" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "1rem", 
                  fontSize: "1.1rem", 
                  fontWeight: "600", 
                  color: "white" 
                }}>
                  Your explanation:
                </label>
                <textarea
                  value={selfExplanation}
                  onChange={(e) => setSelfExplanation(e.target.value)}
                  placeholder="Explain your reasoning... Why did you choose this method? What makes it suitable for this problem?"
                  style={{
                    width: "100%",
                    minHeight: "150px",
                    padding: "1rem",
                    borderRadius: "8px",
                    border: "2px solid rgba(255, 255, 255, 0.3)",
                    fontSize: "1rem",
                    fontFamily: "inherit",
                    resize: "vertical",
                    background: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.1)"
                  }}
                />
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  onClick={handleSelfExplanationSubmit}
                  disabled={!selfExplanation.trim()}
                  style={{
                    background: selfExplanation.trim() ? "#28a745" : "#6c757d",
                    color: "white",
                    border: "none",
                    padding: "1rem 2rem",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    cursor: selfExplanation.trim() ? "pointer" : "not-allowed",
                    transition: "background-color 0.3s ease"
                  }}
                >
                  Submit Explanation
                </button>
              </div>
            </div>
          )}

          {phase === "feedback" && (
            <div>
              <div style={{
                background: selectedMethod === currentProb.bestMethod ? "rgba(212, 237, 218, 0.95)" : "rgba(255, 243, 205, 0.95)",
                border: `2px solid ${selectedMethod === currentProb.bestMethod ? "rgba(40, 167, 69, 0.6)" : "rgba(255, 193, 7, 0.6)"}`,
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "2rem",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}>
                <h2 style={{ 
                  color: selectedMethod === currentProb.bestMethod ? "#155724" : "#856404",
                  marginBottom: "1rem" 
                }}>
                  {selectedMethod === currentProb.bestMethod ? "🎉 Excellent Choice!" : "🤔 Interesting Approach!"}
                </h2>
                
                <p style={{ 
                  color: selectedMethod === currentProb.bestMethod ? "#155724" : "#856404",
                  fontSize: "1.1rem",
                  marginBottom: "1rem" 
                }}>
                  <strong>Your choice:</strong> {selectedMethod}
                </p>
                
                <p style={{ 
                  color: selectedMethod === currentProb.bestMethod ? "#155724" : "#856404",
                  fontSize: "1.1rem",
                  marginBottom: "1rem" 
                }}>
                  <strong>Recommended method:</strong> {currentProb.bestMethod}
                </p>
                
                <p style={{ 
                  color: selectedMethod === currentProb.bestMethod ? "#155724" : "#856404",
                  fontSize: "1rem",
                  lineHeight: "1.6" 
                }}>
                  <strong>Why {currentProb.bestMethod} works well here:</strong> {currentProb.reason}
                </p>
              </div>

              <div style={{
                background: "rgba(248, 249, 250, 0.95)",
                padding: "1.5rem",
                borderRadius: "8px",
                marginBottom: "2rem",
                border: "1px solid rgba(233, 236, 239, 0.5)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}>
                <h3 style={{ color: "#495057", marginBottom: "1rem" }}>Your Explanation:</h3>
                <p style={{ 
                  color: "#6c757d", 
                  fontSize: "1rem", 
                  fontStyle: "italic",
                  lineHeight: "1.6",
                  background: "rgba(255, 255, 255, 0.9)",
                  padding: "1rem",
                  borderRadius: "6px",
                  border: "1px solid rgba(222, 226, 230, 0.5)"
                }}>
                  "{selfExplanation}"
                </p>
              </div>

              <div style={{ textAlign: "center" }}>
                <button
                  onClick={continueAfterFeedback}
                  style={{
                    background: "#007bff",
                    color: "white",
                    border: "none",
                    padding: "1rem 2rem",
                    borderRadius: "8px",
                    fontSize: "1.1rem",
                    fontWeight: "600",
                    cursor: "pointer",
                    transition: "background-color 0.3s ease"
                  }}
                >
                  {currentProblem < practiceProblems.length - 1 ? "Next Problem →" : "Complete Exercise 🎉"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
