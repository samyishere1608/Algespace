// components/RetrospectiveModal.tsx
import React, { useState, useEffect } from "react";

interface ExerciseScore {
  exerciseId: number;
  exerciseType: string;
  method: string;
  hints: number;
  errors: number;
  performanceScore: number;
  completedWithSelfExplanation: boolean;
}

interface RetrospectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (actualScore: number) => void; // Remove retrospectivePercent
  goalTitle?: string;
  autoCalculatedScore?: number; // Number of errors made (mistakes)
  expectedMistakes?: number; // Expected mistakes from goal creation
  contributingExercises?: ExerciseScore[]; // Exercises that contributed to the score
}

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0, left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 9999, // Very high z-index to appear above everything
};

const modalStyle: React.CSSProperties = {
  background: "white",
  padding: "1.5rem 2rem",
  borderRadius: "12px",
  maxWidth: "400px",
  width: "90%",
  boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
  fontFamily: "sans-serif",
};

const buttonStylePrimary: React.CSSProperties = {
  padding: "0.6rem 1.2rem",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  fontWeight: 600,
  backgroundColor: "#007bff",
  color: "white",
};



const RetrospectiveModal: React.FC<RetrospectiveModalProps> = ({ isOpen, onClose, onSubmit, goalTitle, autoCalculatedScore, expectedMistakes, contributingExercises }) => {
  const [actualScore, setActualScore] = useState<number>(0);
  const [showTooltip, setShowTooltip] = useState<boolean>(false);

  console.log(`🔍 RETRO DEBUG: autoCalculatedScore=${autoCalculatedScore} (actual errors), expectedMistakes=${expectedMistakes}, contributingExercises:`, contributingExercises);

  // Helper function to generate encouraging feedback
  const getFeedbackMessage = (actual: number, expected: number) => {
    if (actual < expected) {
      const difference = expected - actual;
      if (difference === 1) return "Great job! 👏";
      if (difference <= 2) return "Excellent! 🌟";
      return "Outstanding! 🎉";
    } else if (actual === expected) {
      return "Perfect prediction! 🎯";
    } else {
      const difference = actual - expected;
      if (difference === 1) return "Keep trying! 💪";
      if (difference <= 2) return "Don't give up! 🚀";
      return "Learning! 📚";
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      // Use the error count directly as the score (no conversion needed)
      if (autoCalculatedScore !== undefined && autoCalculatedScore !== null) {
        setActualScore(autoCalculatedScore); // This is now the number of errors
        console.log(`✅ Using actual errors: ${autoCalculatedScore} mistakes`);
      } else {
        setActualScore(0);
        console.log(`⚠️ No error count available, using 0`);
      }
    }
  }, [isOpen, autoCalculatedScore]);

  const handleSubmit = () => {
    onSubmit(actualScore); // Only pass actual score (error count)
  };

  // Prevent accidental closing with ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        const confirmClose = window.confirm("Are you sure you want to close? Your progress will be lost.");
        if (confirmClose) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  console.log(`🎯 RetrospectiveModal received props: isOpen=${isOpen}`);



  if (!isOpen) {
    console.log(`🎯 RetrospectiveModal: not rendering because isOpen=${isOpen}`);
    return null;
  }

  console.log(`🎯 RetrospectiveModal: rendering modal because isOpen=${isOpen}`);
  
  // Add alert to make sure we can see if modal is trying to render
  console.log(`🚨 MODAL SHOULD BE VISIBLE NOW! If you don't see it, there's a CSS/rendering issue`);
  
  // Test if the modal element gets added to DOM
  setTimeout(() => {
    const modalElements = document.querySelectorAll('[data-modal="retrospective"]');
    console.log(`🔍 Found ${modalElements.length} modal elements in DOM`);
  }, 100);

  return (
    <div style={overlayStyle} data-modal="retrospective" onClick={(e) => e.stopPropagation()}>
      <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
        <h3 style={{ marginTop: 0, marginBottom: "0.5rem", textAlign: "center", color: "black" }}>
          � Performance Result
        </h3>
        {goalTitle && (
          <div style={{ 
            textAlign: "center", 
            marginBottom: "1rem",
            padding: "0.5rem",
            backgroundColor: "#e8f4f8",
            borderRadius: "8px",
            border: "1px solid #b8e6f0"
          }}>
            <strong style={{ color: "#2c5aa0", fontSize: "0.9rem" }}>
              🎯 Goal: "{goalTitle}"
            </strong>
          </div>
        )}
        
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ 
            background: "#e8f5e8", 
            padding: "1rem", 
            borderRadius: "8px", 
            border: "2px solid #28a745",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "#28a745", marginBottom: "0.5rem" }}>
              🎯 Mistakes Comparison
            </div>
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", gap: "1rem" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#6c757d" }}>Expected</div>
                <div style={{ fontSize: "2rem", fontWeight: "bold", color: "#6c757d" }}>{expectedMistakes || 0}</div>
                <div style={{ fontSize: "0.8rem", color: "#6c757d" }}>mistakes</div>
              </div>
              <div style={{ fontSize: "2rem", color: "#6c757d" }}>vs</div>
              <div style={{ textAlign: "center", position: "relative" }}>
                <div style={{ fontSize: "1.2rem", fontWeight: "bold", color: "#28a745" }}>Actual</div>
                <div 
                  style={{ fontSize: "2rem", fontWeight: "bold", color: "#28a745", cursor: contributingExercises && contributingExercises.length > 1 ? "help" : "default" }}
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  title={contributingExercises && contributingExercises.length > 1 ? "Hover to see calculation details" : undefined}
                >
                  {autoCalculatedScore || 0}
                </div>
                <div style={{ fontSize: "0.8rem", color: "#28a745" }}>mistakes</div>
                
                {/* Tooltip for multi-exercise goals */}
                {showTooltip && contributingExercises && contributingExercises.length > 1 && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: "50%",
                    transform: "translateX(-50%)",
                    marginTop: "0.5rem",
                    padding: "0.75rem",
                    backgroundColor: "#fff",
                    border: "2px solid #28a745",
                    borderRadius: "8px",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                    zIndex: 1000,
                    minWidth: "250px",
                    maxWidth: "350px",
                    textAlign: "left",
                    fontSize: "0.85rem",
                    color: "#333"
                  }}>
                    <div style={{ fontWeight: "bold", marginBottom: "0.5rem", color: "#28a745", textAlign: "center" }}>
                      📊 Score Calculation
                    </div>
                    <div style={{ marginBottom: "0.5rem", fontSize: "0.75rem", color: "#666", textAlign: "center" }}>
                      Average of {contributingExercises.length} exercises:
                    </div>
                    {contributingExercises.map((ex, idx) => (
                      <div key={idx} style={{ 
                        padding: "0.4rem",
                        marginBottom: "0.3rem",
                        backgroundColor: "#f8f9fa",
                        borderRadius: "4px",
                        borderLeft: "3px solid #28a745"
                      }}>
                        <div style={{ fontSize: "0.75rem", color: "#666" }}>
                          Exercise {ex.exerciseId} ({ex.exerciseType})
                        </div>
                        <div style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#333" }}>
                          {ex.errors} {ex.errors === 1 ? 'error' : 'errors'} 
                          {ex.completedWithSelfExplanation && " ✏️"}
                        </div>
                      </div>
                    ))}
                    <div style={{ 
                      marginTop: "0.5rem",
                      paddingTop: "0.5rem",
                      borderTop: "1px solid #ddd",
                      textAlign: "center",
                      fontWeight: "bold",
                      color: "#28a745"
                    }}>
                      Average: {autoCalculatedScore || 0} mistakes
                    </div>
                  </div>
                )}
                
                <div style={{ 
                  fontSize: "0.9rem", 
                  fontWeight: "bold", 
                  color: "#007bff", 
                  marginTop: "0.3rem",
                  padding: "0.2rem 0.5rem",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "12px",
                  border: "1px solid #bbdefb"
                }}>
                  {getFeedbackMessage(autoCalculatedScore || 0, expectedMistakes || 0)}
                </div>
              </div>
            </div>
            <div style={{ fontSize: "0.9rem", color: "#666", marginTop: "0.5rem" }}>
              Based on your exercise errors (mistakes made)
            </div>
          </div>
        </div>
        
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button style={buttonStylePrimary} onClick={handleSubmit}>
            Complete ✓
          </button>
        </div>
      </div>
    </div>
  );
};

export default RetrospectiveModal;
