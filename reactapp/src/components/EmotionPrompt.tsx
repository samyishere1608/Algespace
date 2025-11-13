import React, { useState } from "react";
import AgentPopup from "./PedologicalAgent";
import FemaleAfricanSmiling from "@images/flexibility/Agent 3.png";

interface EmotionPromptProps {
  onSubmit: (emotion: string) => void;
  onCancel: () => void;
  context: string;
}

const EMOTIONS = [
  { emoji: "😃", label: "Happy" },
  { emoji: "🙂", label: "Okay" },
  { emoji: "😐", label: "Neutral" },
  { emoji: "😟", label: "Anxious" },
  { emoji: "😴", label: "Bored" },
  { emoji: "😠", label: "Frustrated" },
];

export default function EmotionPrompt({ onSubmit, onCancel, context }: EmotionPromptProps) {
  const [showCheckIn, setShowCheckIn] = useState(false);
const [agentMessage, setAgentMessage] = useState<string | null>(null);
   const handleEmotionClick = (label: string) => {
    onSubmit(label); // Pass emotion back to parent

    if (label === "Frustrated") {
      setAgentMessage("I noticed you're feeling frustrated. It's okay! Want to take a short break or try a simpler problem?");
      setShowCheckIn(true);

      // Auto-hide message after 5 seconds
      setTimeout(() => {
        setAgentMessage(null);
      }, 5000);
    }
  };


  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex",
      justifyContent: "center", alignItems: "center", zIndex: 1000
    }}>
      <div style={{
        background: "white", padding: 20, borderRadius: 10, textAlign: "center",
        maxWidth: 300
      }}>
        <h3>🧠 How are you feeling?</h3>
        <p style={{ fontSize: 14 }}>After: <strong>{context}</strong></p>
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center" }}>
          {EMOTIONS.map((e) => (
            <button
              key={e.label}
              style={{
                fontSize: "1.5rem", margin: 8, padding: 10,
                border: "1px solid #ccc", borderRadius: 8,
                background: "#f9f9f9", cursor: "pointer",
              }}
              onClick={() => handleEmotionClick(e.label)}
              title={e.label}
            >
                 {showCheckIn && (
  <AgentPopup
    message="Good work! You completed 3 goals in a row!"
    image={FemaleAfricanSmiling}
    onClose={() => setShowCheckIn(false)}
  />
)}
              {e.emoji}
            </button>
          ))}
   
        </div>
        
        <button onClick={onCancel} style={{ marginTop: 10, color: "gray" }}>Cancel</button>
    
      </div>
    </div>
  );
}
