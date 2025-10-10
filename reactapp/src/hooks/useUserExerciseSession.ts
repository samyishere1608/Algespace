/**
 * User-aware exercise session tracking hook
 * Maintains hints and errors counts tied to specific user IDs
 * Automatically switches when study session changes
 */
import { useState, useEffect } from 'react';
import { getCurrentUserId } from '@/utils/studySession';

interface UserExerciseSession {
    hints: number;
    errors: number;
    timestamp?: number; // When the session was last updated
}

// Storage key generator for user-specific session data per individual exercise
const getSessionKey = (userId: number, exerciseType: string, exerciseId?: number) => 
    exerciseId ? `exerciseSession_${userId}_${exerciseType}_${exerciseId}` : `exerciseSession_${userId}_${exerciseType}`;

export function useUserExerciseSession(exerciseType: string, explicitUserId?: number, exerciseId?: number) {
    const [currentUserId, setCurrentUserId] = useState<number>(explicitUserId || getCurrentUserId());
    const [session, setSession] = useState<UserExerciseSession>(() => {
        // ALWAYS start fresh for each exercise attempt
        // Old session data is only for goal completion reference, not for reuse
        console.log(`📊 Starting FRESH session for user ${explicitUserId || getCurrentUserId()}, ${exerciseType} exercise ${exerciseId}`);
        return { hints: 0, errors: 0, timestamp: Date.now() };
    });

    // Monitor userId changes
    useEffect(() => {
        const newUserId = explicitUserId || getCurrentUserId();
        
        if (newUserId !== currentUserId) {
            console.log(`📊 UserExerciseSession: userId changed from ${currentUserId} to ${newUserId} for exercise ${exerciseId}`);
            
            // Save current session for old user
            const oldKey = getSessionKey(currentUserId, exerciseType, exerciseId);
            sessionStorage.setItem(oldKey, JSON.stringify(session));
            
            // Always start fresh for new user (don't load old session)
            // Old sessions are only saved for goal completion reference
            setSession({ hints: 0, errors: 0, timestamp: Date.now() });
            console.log(`📊 Started fresh session for user ${newUserId}, exercise ${exerciseId}`);
            
            setCurrentUserId(newUserId);
        }
    }, [explicitUserId, currentUserId, exerciseType, exerciseId, session]);

    // Periodic check for userId changes (if no explicit userId provided)
    useEffect(() => {
        if (!explicitUserId) {
            const interval = setInterval(() => {
                const newUserId = getCurrentUserId();
                if (newUserId !== currentUserId) {
                    console.log(`📊 UserExerciseSession: detected userId change to ${newUserId} for exercise ${exerciseId}`);
                    // The effect above will handle the switch
                }
            }, 2000);
            
            return () => clearInterval(interval);
        }
        
        // Return empty cleanup function if explicitUserId is provided
        return () => {};
    }, [explicitUserId, currentUserId, exerciseId]);

    // Save session data whenever it changes (but don't include session in deps to avoid infinite loop)
    useEffect(() => {
        const key = getSessionKey(currentUserId, exerciseType, exerciseId);
        sessionStorage.setItem(key, JSON.stringify(session));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUserId, exerciseType, exerciseId]);
    
    // Also save when session actually changes
    useEffect(() => {
        const key = getSessionKey(currentUserId, exerciseType, exerciseId);
        sessionStorage.setItem(key, JSON.stringify(session));
    }, [session.hints, session.errors, currentUserId, exerciseType, exerciseId]);

    // Cleanup on unmount or when exercise changes
    useEffect(() => {
        return () => {
            // Save one final time before unmount
            const key = getSessionKey(currentUserId, exerciseType, exerciseId);
            sessionStorage.setItem(key, JSON.stringify(session));
            console.log(`🧹 Saved session on cleanup for user ${currentUserId}, exercise ${exerciseId}:`, session);
        };
    }, [currentUserId, exerciseType, exerciseId, session]);
    
    // Functions to update session data
    const trackHint = () => {
        setSession(prev => {
            const newSession = { ...prev, hints: prev.hints + 1, timestamp: Date.now() };
            console.log(`💡 User ${currentUserId} used hint in ${exerciseType} exercise ${exerciseId} (total: ${newSession.hints})`);
            return newSession;
        });
    };

    const trackError = () => {
        setSession(prev => {
            const newSession = { ...prev, errors: prev.errors + 1, timestamp: Date.now() };
            console.log(`❌ User ${currentUserId} made error in ${exerciseType} exercise ${exerciseId} (total: ${newSession.errors})`);
            return newSession;
        });
    };

    const resetSession = () => {
        const newSession = { hints: 0, errors: 0, timestamp: Date.now() };
        setSession(newSession);
        const key = getSessionKey(currentUserId, exerciseType, exerciseId);
        sessionStorage.setItem(key, JSON.stringify(newSession));
        console.log(`🔄 Reset session for user ${currentUserId} in ${exerciseType} exercise ${exerciseId}`);
    };

    // Force save current session to sessionStorage (for use before async operations)
    const forceSaveSession = () => {
        const key = getSessionKey(currentUserId, exerciseType, exerciseId);
        sessionStorage.setItem(key, JSON.stringify(session));
        console.log(`💾 Force saved session for user ${currentUserId} in ${exerciseType} exercise ${exerciseId}:`, session);
    };

    return {
        userId: currentUserId,
        hints: session.hints,
        errors: session.errors,
        trackHint,
        trackError,
        resetSession,
        forceSaveSession
    };
}