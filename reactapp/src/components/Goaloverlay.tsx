import { useEffect, useState } from "react";
import "@/assets/styles/GoalOverlay.css"; 
import GoalSettingView from "@/views/Goalsetting";
import { getStudySession } from "@/utils/studySession";

export default function GoalOverlay({ onClose }: { onClose: () => void }) {
  // Only pass userId if there's an active study session, otherwise let GoalSettingView handle it
  const [studyUserId, setStudyUserId] = useState<number | undefined>(() => {
    const studySession = getStudySession();
    const userId = studySession ? studySession.userId : undefined;
    console.log('🎯 GoalOverlay initialized - studySession:', studySession);
    console.log('🎯 GoalOverlay initialized - passing userId:', userId);
    return userId;
  });

  // Check for study session changes periodically, but only if there's a study session
  useEffect(() => {
    const checkSession = () => {
      const studySession = getStudySession();
      const newUserId = studySession ? studySession.userId : undefined;
      if (newUserId !== studyUserId) {
        console.log('🎯 GoalOverlay userId changed from', studyUserId, 'to', newUserId);
        setStudyUserId(newUserId);
      }
    };

    // Check immediately and then every second, but only if we have a study session
    checkSession();
    const interval = setInterval(checkSession, 1000);
    
    return () => clearInterval(interval);
  }, [studyUserId]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className="goal-overlay-container">
      <div className="goal-overlay-backdrop" onClick={onClose} />
      <div className="goal-overlay-content">
        <button 
          onClick={onClose} 
          className="goal-overlay-close"
          aria-label="Close goal setting modal"
          title="Close (Esc)"
        >
          ✕
        </button>
        {/* Only pass userId prop if there's a study session, otherwise let manual input work */}
        {studyUserId ? (
          <GoalSettingView userId={studyUserId} />
        ) : (
          <GoalSettingView />
        )}
      </div>
    </div>
  );
}
