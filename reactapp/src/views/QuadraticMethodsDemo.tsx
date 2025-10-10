import React from "react";
import { QuadraticMethodsExercise } from "@/components/flexibility/exercises/QuadraticMethodsExercise";
import { GoalCompletionProvider } from "@/contexts/GoalCompletionContext";

export default function QuadraticMethodsDemo(): React.ReactElement {
  const handleComplete = () => {
    alert("🎉 Quadratic Methods Exercise completed! Great job!");
  };

  const mockCompleteGoalByTitle = (title: string) => {
    console.log(`✅ Goal completed: ${title}`);
  };

  return (
    <GoalCompletionProvider completeGoalByTitle={mockCompleteGoalByTitle}>
      <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
        <QuadraticMethodsExercise onComplete={handleComplete} />
      </div>
    </GoalCompletionProvider>
  );
}
