import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TranslationNamespaces } from "@/i18n";
import { GoalSettingTranslations } from "@/types/shared/goalsettingTranslations.ts";


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
  goalName?: string; // Add optional goal name
}
// ✅ REMOVED old emotional feedback system - now using adaptive feedback

export default function PostTaskAppraisal({ isOpen, onClose, onSubmit, goalName }: Props) {
  const { t } = useTranslation(TranslationNamespaces.GoalSetting);
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
      1: t(GoalSettingTranslations.SATISFACTION_NOT_SATISFIED),
      2: t(GoalSettingTranslations.SATISFACTION_SOMEWHAT),
      3: t(GoalSettingTranslations.SATISFACTION_SATISFIED),
      4: t(GoalSettingTranslations.SATISFACTION_VERY_SATISFIED),
      5: t(GoalSettingTranslations.SATISFACTION_EXTREMELY_SATISFIED)
    };
    return labels[value as keyof typeof labels];
  };



  const getConfidenceLabel = (value: number) => {
    const labels = {
      1: t(GoalSettingTranslations.CONFIDENCE_BEGINNING),
      2: t(GoalSettingTranslations.CONFIDENCE_GROWING),
      3: t(GoalSettingTranslations.CONFIDENCE_MODERATE),
      4: t(GoalSettingTranslations.CONFIDENCE_HIGH),
      5: t(GoalSettingTranslations.CONFIDENCE_MASTER)
    };
    return labels[value as keyof typeof labels];
  };

  const getEffortLabel = (value: number) => {
    const labels = {
      1: t(GoalSettingTranslations.EFFORT_MINIMAL),
      2: t(GoalSettingTranslations.EFFORT_SOME),
      3: t(GoalSettingTranslations.EFFORT_MODERATE),
      4: t(GoalSettingTranslations.EFFORT_STRONG),
      5: t(GoalSettingTranslations.EFFORT_EXCEPTIONAL)
    };
    return labels[value as keyof typeof labels];
  };

  const getEnjoymentLabel = (value: number) => {
    const labels = {
      1: t(GoalSettingTranslations.ENJOYMENT_NOT_ENJOYABLE),
      2: t(GoalSettingTranslations.ENJOYMENT_SOMEWHAT),
      3: t(GoalSettingTranslations.ENJOYMENT_ENJOYABLE),
      4: t(GoalSettingTranslations.ENJOYMENT_VERY_ENJOYABLE),
      5: t(GoalSettingTranslations.ENJOYMENT_EXTREMELY_ENJOYABLE)
    };
    return labels[value as keyof typeof labels];
  };



  const getAnxietyLabel = (value: number) => {
    const labels = {
      1: t(GoalSettingTranslations.ANXIETY_NOT_ANXIOUS),
      2: t(GoalSettingTranslations.ANXIETY_SOMEWHAT),
      3: t(GoalSettingTranslations.ANXIETY_ANXIOUS),
      4: t(GoalSettingTranslations.ANXIETY_VERY_ANXIOUS),
      5: t(GoalSettingTranslations.ANXIETY_EXTREMELY_ANXIOUS)
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
    
    // Note: PostTaskAppraisal completion triggers goal feedback messages
    // The actual completion event for auto-close will be dispatched by GoalList 
    // after all adaptive feedback messages are shown
    console.log('🎯 PostTaskAppraisal: Form submitted - goal feedback will start');
    
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
        <h3 style={{ textAlign: "center", marginBottom: "0.5rem" }}>{t(GoalSettingTranslations.POSTTASK_TITLE)}</h3>
        
        {/* Display goal name if provided */}
        {goalName && (
          <div style={{
            textAlign: "center",
            marginBottom: "1rem",
            padding: "0.75rem",
            backgroundColor: "#f0f8ff",
            borderRadius: "8px",
            border: "2px solid #229EBC"
          }}>
            <strong style={{ color: "#229EBC" }}>{t("ui.goal")}:</strong>{" "}
            <span style={{ color: "#333" }}>{goalName}</span>
          </div>
        )}
        
        <div style={{ marginBottom: "1.5rem" }}>
          <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("post-task-appraisal.satisfaction-question")}</label>
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
          <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("post-task-appraisal.confidence-question")}</label>
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
          <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("post-task-appraisal.effort-question")}</label>
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
          <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("post-task-appraisal.enjoyment-question")}</label>
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
          <label style={{ display: "block", marginBottom: "0.5rem" }}>{t("post-task-appraisal.anxiety-question")}</label>
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
            {t("ui.cancel")}
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
      {t("ui.submit")}
    </button>
        </div>
      </div>
    </div>
  );
}