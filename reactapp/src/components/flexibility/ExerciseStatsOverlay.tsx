import { ReactElement, useState, useEffect } from 'react';
import { getCurrentUserId } from '@/utils/studySession';

interface ExerciseStatsOverlayProps {
    hints: number;
    errors: number;
    exerciseName?: string;
    userId?: number; // Optional prop to override getCurrentUserId()
}

export function ExerciseStatsOverlay({ hints, errors, exerciseName, userId }: ExerciseStatsOverlayProps): ReactElement {
    const [currentUserId, setCurrentUserId] = useState<number>(userId || getCurrentUserId());
    
    // Update userId when study session changes
    useEffect(() => {
        const newUserId = userId || getCurrentUserId();
        if (newUserId !== currentUserId) {
            console.log(`📊 ExerciseStatsOverlay: userId changed from ${currentUserId} to ${newUserId}`);
            setCurrentUserId(newUserId);
        }
    }, [userId, currentUserId]);

    // Check for userId changes every 2 seconds (in case study session changes)
    useEffect(() => {
        if (!userId) { // Only auto-check if userId is not explicitly provided
            const interval = setInterval(() => {
                const newUserId = getCurrentUserId();
                if (newUserId !== currentUserId) {
                    console.log(`📊 ExerciseStatsOverlay: detected userId change from ${currentUserId} to ${newUserId}`);
                    setCurrentUserId(newUserId);
                }
            }, 2000);
            
            return () => clearInterval(interval);
        }
        
        // Return empty cleanup function if userId is explicitly provided
        return () => {};
    }, [currentUserId, userId]);
    return (
        <div style={{
            position: 'fixed',
            top: '400px',
            left: '10px', // Moved further left to avoid overlapping with other overlays
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #007bff',
            borderRadius: '12px',
            padding: '1rem',
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            minWidth: '200px',
            fontFamily: 'Arial, sans-serif',
            backdropFilter: 'blur(10px)'
        }}>
            <div style={{
                fontSize: '1rem',
                fontWeight: 'bold',
                color: '#007bff',
                marginBottom: '0.5rem',
                textAlign: 'center',
                borderBottom: '1px solid #e0e0e0',
                paddingBottom: '0.5rem'
            }}>
                📊 Exercise Progress
            </div>
            
            {exerciseName && (
                <div style={{
                    fontSize: '0.85rem',
                    color: '#666',
                    textAlign: 'center',
                    marginBottom: '0.75rem',
                    fontWeight: '500'
                }}>
                    {exerciseName}
                </div>
            )}
            
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '1rem'
            }}>
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1
                }}>
                    <div style={{
                        fontSize: '1.5rem',
                        marginBottom: '0.25rem'
                    }}>
                        💡
                    </div>
                    <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: hints > 0 ? '#ffa500' : '#28a745'
                    }}>
                        {hints}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#666',
                        textAlign: 'center'
                    }}>
                        Hints Used
                    </div>
                </div>
                
                <div style={{
                    width: '1px',
                    height: '60px',
                    backgroundColor: '#e0e0e0'
                }}></div>
                
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    flex: 1
                }}>
                    <div style={{
                        fontSize: '1.5rem',
                        marginBottom: '0.25rem'
                    }}>
                        ❌
                    </div>
                    <div style={{
                        fontSize: '1.2rem',
                        fontWeight: 'bold',
                        color: errors > 0 ? '#dc3545' : '#28a745'
                    }}>
                        {errors}
                    </div>
                    <div style={{
                        fontSize: '0.75rem',
                        color: '#666',
                        textAlign: 'center'
                    }}>
                        Errors Made
                    </div>
                </div>
            </div>
            
            {/* Progress indicator */}
            <div style={{
                marginTop: '0.75rem',
                textAlign: 'center'
            }}>
                <div style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    marginBottom: '0.25rem'
                }}>
                    Performance
                </div>
                <div style={{
                    padding: '0.25rem 0.5rem',
                    borderRadius: '15px',
                    fontSize: '0.75rem',
                    fontWeight: 'bold',
                    backgroundColor: errors === 0 && hints === 0 ? '#d4edda' : 
                                  errors === 0 ? '#fff3cd' : '#f8d7da',
                    color: errors === 0 && hints === 0 ? '#155724' :
                           errors === 0 ? '#856404' : '#721c24'
                }}>
                    {errors === 0 && hints === 0 ? '🏆 Perfect!' :
                     errors === 0 ? '🌟 Great!' : '💪 Keep Going!'}
                </div>
            </div>
        </div>
    );
}