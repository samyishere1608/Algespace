import React from 'react';
import { DiscrepancyChart } from './DiscrepancyFeedback';

interface DiscrepancyFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  expected: number;
  perceived: number;
  actual: number;
}

const DiscrepancyFeedbackModal: React.FC<DiscrepancyFeedbackModalProps> = ({
  isOpen,
  onClose,
  expected,
  perceived,
  actual,
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '12px',
          maxWidth: '600px',
          width: '90%',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        }}
      >
        <h3 style={{ marginBottom: '1rem', color: '#004085', textAlign: 'center' }}>
          Performance Comparison
        </h3>
        <DiscrepancyChart
          expected={expected}
          perceived={perceived}
          actual={actual}
        />
        <button
          onClick={onClose}
          style={{
            display: 'block',
            margin: '1rem auto 0',
            padding: '0.5rem 1rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: 'bold',
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default DiscrepancyFeedbackModal;