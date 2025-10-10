import React, { useState } from 'react';

interface DebugOverlayProps {
  hints: number;
  errors: number;
  exerciseType?: string;
  method?: string;
  userId?: number;
}

const DebugOverlay: React.FC<DebugOverlayProps> = ({ 
  hints, 
  errors, 
  exerciseType = 'unknown', 
  method = 'unknown',
  userId = 0 
}) => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [position, setPosition] = useState({ x: 10, y: 10 });

  const overlayStyle: React.CSSProperties = {
    position: 'fixed',
    top: position.y,
    left: position.x,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: isMinimized ? '8px 12px' : '12px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontFamily: 'monospace',
    zIndex: 999999,
    border: '2px solid #00ff00',
    minWidth: isMinimized ? 'auto' : '200px',
    cursor: 'move',
    userSelect: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
  };

  const titleStyle: React.CSSProperties = {
    color: '#00ff00',
    fontWeight: 'bold',
    marginBottom: isMinimized ? '0' : '8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const valueStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '4px'
  };

  const errorStyle: React.CSSProperties = {
    color: errors > 0 ? '#ff4444' : '#44ff44'
  };

  const hintStyle: React.CSSProperties = {
    color: hints > 0 ? '#ffaa44' : '#44ff44'
  };

  return (
    <div 
      style={overlayStyle}
      onMouseDown={(e) => {
        const startX = e.clientX - position.x;
        const startY = e.clientY - position.y;
        
        const handleMouseMove = (e: MouseEvent) => {
          setPosition({
            x: e.clientX - startX,
            y: e.clientY - startY
          });
        };
        
        const handleMouseUp = () => {
          document.removeEventListener('mousemove', handleMouseMove);
          document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
      }}
    >
      <div style={titleStyle}>
        <span>🐛 DEBUG</span>
        <button
          onClick={() => setIsMinimized(!isMinimized)}
          style={{
            background: 'none',
            border: 'none',
            color: '#00ff00',
            cursor: 'pointer',
            padding: '0',
            fontSize: '12px'
          }}
        >
          {isMinimized ? '▲' : '▼'}
        </button>
      </div>
      
      {!isMinimized && (
        <>
          <div style={valueStyle}>
            <span>🔴 Errors:</span>
            <span style={errorStyle}>{errors}</span>
          </div>
          <div style={valueStyle}>
            <span>💡 Hints:</span>
            <span style={hintStyle}>{hints}</span>
          </div>
          <div style={valueStyle}>
            <span>📝 Type:</span>
            <span>{exerciseType}</span>
          </div>
          <div style={valueStyle}>
            <span>⚙️ Method:</span>
            <span>{method}</span>
          </div>
          <div style={valueStyle}>
            <span>👤 User:</span>
            <span>{userId}</span>
          </div>
        </>
      )}
    </div>
  );
};

export default DebugOverlay;