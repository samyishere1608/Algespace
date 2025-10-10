// src/components/GoalListOverlay.tsx
import React from "react";
import { Goal } from "@/types/goal";
import { GoalList } from "@/components/goalsetting/GoalList";

interface GoalListOverlayProps {
  goals: Goal[];
  onClose: () => void;
  userId: number;
  onGoalsChange: (goals: Goal[]) => void;
}

export default function GoalListOverlay({ goals, onClose, userId, onGoalsChange }: GoalListOverlayProps) {
  return (
    <div style={{
      position: "fixed",
      top: 0,
      right: 0,
      width: "350px",
      height: "550px",
      backgroundColor: "#043853",
      boxShadow: "-2px 0 8px rgba(0,0,0,0.2)",
      zIndex: 2000,
      padding: "1rem",
      overflowY: "auto",
      transition: "transform 0.3s ease-in-out",
      border:"2px solid #043853"
    }}>
      {/* <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
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
      </div> */}

      <GoalList goals={goals} onGoalsChange={onGoalsChange} userId={userId} showOnlyActive={true} compact={true} />
    </div>
  );
}
