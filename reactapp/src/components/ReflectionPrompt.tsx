import React, { useState } from "react";

export default function ReflectionPrompt({ onSubmit }: { onSubmit: (text: string) => void }) {
  const [selected, setSelected] = useState("");
  const [custom, setCustom] = useState("");

  const options = [
    "I focused better today",
    "I tried a new method",
    "I got help",
    "Other"
  ];

  return (
    <div className="popup">
      <h4>🎉 You completed your goal!</h4>
      <p>What helped you the most?</p>

      {options.map(opt => (
        <button key={opt} onClick={() => setSelected(opt)}>
          {opt}
        </button>
      ))}

      {selected === "Other" && (
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder="Type your own reason"
        />
      )}

      <button
        onClick={() => onSubmit(selected === "Other" ? custom : selected)}
        disabled={!selected || (selected === "Other" && !custom)}
      >
        Submit Reflection
      </button>
    </div>
  );
}
