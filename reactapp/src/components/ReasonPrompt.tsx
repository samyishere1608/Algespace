import React, { useState } from "react";

interface ReasonPromptProps {
  title: string;
  placeholder?: string;
  onSubmit: (reason: string) => void;
  onCancel: () => void;
}

export default function ReasonPrompt({ title, placeholder, onSubmit, onCancel }: ReasonPromptProps) {
  const [reason, setReason] = useState("");

  return (
    <div style={overlayStyle}>
      <div style={modalStyle}>
        <h3 style={{
          color:"black"
        }}>{title}</h3>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={placeholder || "Type your reason here..."}
          style={{
            width: "100%",
            minHeight: "80px",
            padding: "8px",
            border: "1px solid #ccc",
            borderRadius: "6px",
            resize: "none"
          }}
        />
        <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
          <button onClick={onCancel} style={cancelBtnStyle}>Cancel</button>
          <button
            onClick={() => {
              if (reason.trim()) onSubmit(reason);
            }}
            style={submitBtnStyle}
          >
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

// Simple inline styles (you can later move to CSS file)
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  background: "rgba(0,0,0,0.4)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 2000
};

const modalStyle: React.CSSProperties = {
  background: "#fff",
  padding: "1.5rem",
  borderRadius: "10px",
  maxWidth: "400px",
  width: "90%",
  boxShadow: "0 4px 15px rgba(0,0,0,0.2)"
};

const cancelBtnStyle: React.CSSProperties = {
  background: "#ccc",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer"
};

const submitBtnStyle: React.CSSProperties = {
  background: "#007bff",
  color: "#fff",
  border: "none",
  padding: "0.5rem 1rem",
  borderRadius: "6px",
  cursor: "pointer"
};
