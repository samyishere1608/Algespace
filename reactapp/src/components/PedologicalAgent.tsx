import { useEffect } from "react";

interface AgentPopupProps {
  message: string;
  image: string;
  onClose: () => void;
  duration?: number;
}

export default function AgentPopup({ message, image, onClose, duration = 4000 }: AgentPopupProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <>
      {/* Agent Avatar - positioned in bottom-right for adaptive feedback */}
      <div style={{
        position: "fixed",
        bottom: "0",
        right: "32px", // Fixed right position for adaptive feedback area
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        alignItems: "center",
        height: "12rem", // 192px - matches system agent
        width: "8.75rem", // 140px - matches system agent
        zIndex: 999
      }}>
        <img 
          src={image} 
          alt="Agent" 
          style={{ 
            width: "8rem", // 128px - matches --normal size from system
            objectFit: "contain"
          }} 
        />
      </div>
      
      {/* Speech Bubble - positioned next to our agent in bottom-right */}
      <div style={{
        position: "fixed",
        bottom: "2rem", // 32px - matches system agent
        right: "172px", // 32px (agent right) + 140px (agent width) = 172px
        zIndex: 999,
        maxWidth: "300px" // Matches system agent maxWidth
      }}>
        {/* Close button - matches system styling */}
        <button 
          onClick={onClose}
          style={{
            position: "absolute",
            top: "0",
            right: "0",
            background: "var(--primary-blue, #219ebc)",
            color: "white",
            border: "none",
            borderRadius: "0.25rem",
            padding: "0.25rem 0.5rem",
            fontSize: "0.875rem",
            cursor: "pointer",
            zIndex: 1000
          }}
        >
          ✕
        </button>
        
        {/* Speech bubble container - matches system styling */}
        <div style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          gap: "1rem",
          padding: "1rem",
          borderRadius: "0.5rem",
          backgroundColor: "white",
          boxShadow: "var(--shadow, 2px 2px 2px rgba(0, 0, 0, 0.25))",
          position: "relative"
        }}>
          {/* Speech bubble tail - matches system agent, flipped for right side */}
          <div style={{
            content: '""',
            position: "absolute",
            bottom: "1rem",
            right: "-0.5rem",
            borderWidth: "0.5rem 0 0.5rem 0.75rem",
            borderStyle: "solid",
            borderColor: "transparent transparent transparent #fff"
          }} />
          
          {/* Message content */}
          <p style={{
            color: "var(--dark-text, #333333)",
            fontSize: "1rem",
            lineHeight: "1.5",
            padding: "0",
            margin: "0",
            userSelect: "none",
            WebkitUserSelect: "none",
            wordBreak: "break-word",
            overflowWrap: "break-word"
          }}>
            {message}
          </p>
        </div>
      </div>
    </>
  );
}
