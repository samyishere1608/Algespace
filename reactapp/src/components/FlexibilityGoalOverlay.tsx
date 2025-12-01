// Custom GoalListOverlay for Flexibility exercises that exposes completion function
import { useEffect } from "react";
import { Goal } from "@/types/goal";
import GoalList from "@/components/goalsetting/GoalList";

interface FlexibilityGoalOverlayProps {
  goals: Goal[];
  onClose: () => void;
  userId: number;
  onGoalsChange: (goals: Goal[]) => void;
  onCompletionFunctionReady: (completionFn: (title: string) => void) => void;
}

export default function FlexibilityGoalOverlay({ 
  goals, 
  onClose, 
  userId, 
  onGoalsChange,
  onCompletionFunctionReady 
}: FlexibilityGoalOverlayProps) {
  
  // We need to get the completion function from GoalList, not create a new one
  // The GoalList already has the proper retrospective flow built-in
  useEffect(() => {
    // For now, we'll create a placeholder function
    // The real fix is to extract the completion function from GoalList
    const placeholderCompletion = (title: string) => {
      console.log(`🎯 FlexibilityGoalOverlay: Placeholder completion for "${title}"`);
    };
    onCompletionFunctionReady(placeholderCompletion);
  }, [onCompletionFunctionReady]);

  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "350px",
      height: "100vh",
      backgroundColor: "#043853",
      boxShadow: "-2px 0 8px rgba(0,0,0,0.2)",
      zIndex: 2000,
      padding: "1rem",
      overflowY: "auto",
      transition: "transform 0.3s ease-in-out",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3>🎯 Your Goals</h3>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            fontSize: "1.5rem",
            cursor: "pointer",
          }}
        >
          ❌
        </button>
      </div>

      <GoalList goals={goals} onGoalsChange={onGoalsChange} userId={userId} />
    </div>
  );
}
