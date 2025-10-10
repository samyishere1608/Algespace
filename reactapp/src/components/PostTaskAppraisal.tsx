import { useState, useEffect } from "react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    postSatisfaction: number, 
    postConfidence: number,
    posteffort: number,
    postenjoyment: number,
    postanxiety: number
  ) => void;
}
// ✅ REMOVED old emotional feedback system - now using adaptive feedback

export default function PostTaskAppraisal({ isOpen, onClose, onSubmit }: Props) {
  const [postSatisfaction, setPostSatisfaction] = useState(3);
  const [postConfidence, setPostConfidence] = useState(3);
  const [postEffort, setPostEffort] = useState(3);
  const [postEnjoyment, setPostEnjoyment] = useState(3);
  const [postAnxiety, setPostAnxiety] = useState(3);

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

  const getSatisfactionLabel = (value: number) => {
    const labels = {
      1: "😔 Not satisfied",
      2: "🙁 Somewhat satisfied",
      3: "😊 Satisfied",
      4: "😃 Very satisfied",
      5: "🤩 Extremely satisfied"
    };
    return labels[value as keyof typeof labels];
  };



  const getConfidenceLabel = (value: number) => {
    const labels = {
      1: "🌱 Beginning to learn",
      2: "🌿 Growing confidence",
      3: "🌳 Moderate confidence",
      4: "🚀 High confidence",
      5: "⭐ Master level"
    };
    return labels[value as keyof typeof labels];
  };

  const getEffortLabel = (value: number) => {
    const labels = {
      1: "😴 Minimal effort",
      2: "😐 Some effort",
      3: "😌 Moderate effort",
      4: "💪 Strong effort",
      5: "🏆 Exceptional effort"
    };
    return labels[value as keyof typeof labels];
  };

  const getEnjoymentLabel = (value: number) => {
    const labels = {
      1: "😔 Not enjoyable",
      2: "🙁 Somewhat enjoyable",
      3: "😊 Enjoyable",
      4: "😃 Very enjoyable",
      5: "🤩 Extremely enjoyable"
    };
    return labels[value as keyof typeof labels];
  };



  const getAnxietyLabel = (value: number) => {
    const labels = {
      1: "🤩 Not anxious",
      2: "😃 Somewhat anxious",
      3: "🙁 Anxious",
      4: "😔 Very anxious",
      5: "😰 Extremely anxious"
    };
    return labels[value as keyof typeof labels];
  };

  const handleCancel = () => {
    const confirmClose = window.confirm("Are you sure you want to cancel? Your responses will be lost.");
    if (confirmClose) {
      onClose();
    }
  };

  const handleSubmit = () => {
    // ✅ REMOVED old emotional feedback - now handled by adaptive feedback system
    onSubmit(postSatisfaction, postConfidence, postEffort, postEnjoyment, postAnxiety);
    onClose();
    
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: "rgba(0,0,0,0.5)",
      display: "flex", justifyContent: "center", alignItems: "center", zIndex: 999,color:"black"
    }}
    onClick={(e) => e.stopPropagation()}
    >
      <div style={{
        background: "#fff",
        padding: "2rem",
        borderRadius: "12px",
        width: "400px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.15)"
      }}
      onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ textAlign: "center", marginBottom: "1.5rem" }}>🎯 Goal Reflection</h3>
        
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>How satisfied are you?</label>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem",color:"black" }}>
            <input 
              type="range" 
              min="1" 
              max="5" 
              value={postSatisfaction} 
              onChange={(e) => setPostSatisfaction(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: "150px" }}>{getSatisfactionLabel(postSatisfaction)}</span>
          </div>
        </div>

        <div style={{ marginBottom: "2rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>Your confidence level now?</label>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <input 
              type="range" 
              min="1" 
              max="5" 
              value={postConfidence} 
              onChange={(e) => setPostConfidence(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ minWidth: "150px" }}>{getConfidenceLabel(postConfidence)}</span>
          </div>
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>How much effort did you put in?</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={postEffort} 
            onChange={(e) => setPostEffort(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <span style={{ minWidth: "150px" }}>{getEffortLabel(postEffort)}</span>
        </div>
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>How much enjoyment did you get from this?</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={postEnjoyment} 
            onChange={(e) => setPostEnjoyment(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <span style={{ minWidth: "150px" }}>{getEnjoymentLabel(postEnjoyment)}</span>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>How much anxiety did you feel?</label>
          <input 
            type="range" 
            min="1" 
            max="5" 
            value={postAnxiety} 
            onChange={(e) => setPostAnxiety(Number(e.target.value))}
            style={{ width: "100%" }}
          />
          <span style={{ minWidth: "150px" }}>{getAnxietyLabel(postAnxiety)}</span>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "1rem" }}>
          <button 
            onClick={handleCancel}
            style={{
              padding: "0.5rem 1rem",
              border: "1px solid #ccc",
              borderRadius: "6px",
              background: "#fff",color:"black"
            }}
          >
            Cancel
          </button>
      <button 
      onClick={handleSubmit}
      style={{
        padding: "0.5rem 1.5rem",
        border: "none",
        borderRadius: "6px",
        background: "#007bff",
        color: "#fff",
        cursor: "pointer"
      }}
    >
      Submit
    </button>
        </div>
      </div>
    </div>
  );
}