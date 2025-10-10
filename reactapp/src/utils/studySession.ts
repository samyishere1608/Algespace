/**
 * Study Session Management Utilities
 * Handles authentication and session management for study participants
 * while maintaining compatibility with the existing public access system.
 */

export interface StudySession {
    userId: number;
    participantId: string;
    loginTime: string;
    mode: 'study';
    sessionId: string;
}

/**
 * Generates a unique session ID for tracking
 */
const generateSessionId = (): string => {
    return 'sess_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
};

/**
 * Creates a new study session for a participant
 */
export const createStudySession = async (participantId: string): Promise<StudySession> => {
    try {
        // Call backend to get unique userId for this participant
        const response = await fetch('/api/goals/study/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId: participantId.trim().toUpperCase() })
        });

        if (!response.ok) {
            throw new Error(`Backend authentication failed: ${response.status}`);
        }

        const authData = await response.json();
        
        const session: StudySession = {
            userId: authData.userId, // Backend-provided userId
            participantId: authData.participantId,
            loginTime: new Date().toISOString(),
            mode: 'study',
            sessionId: generateSessionId()
        };
        
        // Store the session
        localStorage.setItem('flexibilityStudySession', JSON.stringify(session));
        
        console.log(`🔬 Study session authenticated via backend for participant: ${session.participantId}, User ID: ${session.userId}`);
        return session;
    } catch (error) {
        console.error('Study authentication failed:', error);
        throw error;
    }
};

/**
 * Gets the current active study session
 */
export const getStudySession = (): StudySession | null => {
    const session = localStorage.getItem('flexibilityStudySession');
    if (!session) return null;
    
    try {
        const parsed = JSON.parse(session);
        // Ensure userId is always a number, not a string
        if (parsed && typeof parsed.userId !== 'number') {
            parsed.userId = parseInt(parsed.userId, 10);
            // If parsing fails, this session is corrupted
            if (isNaN(parsed.userId)) {
                console.warn('Corrupted study session detected, clearing...');
                clearStudySession();
                return null;
            }
        }
        return parsed;
    } catch (error) {
        console.error('Error parsing study session:', error);
        clearStudySession();
        return null;
    }
};

/**
 * Clears the current study session
 */
export const clearStudySession = (): void => {
    localStorage.removeItem('flexibilityStudySession');
    console.log('🚪 Study session ended');
};

/**
 * Validates if a participant ID is acceptable
 */
export const validateParticipantId = (participantId: string): { valid: boolean; message?: string } => {
    const trimmed = participantId.trim();
    
    if (!trimmed) {
        return { valid: false, message: "Participant ID cannot be empty" };
    }
    
    if (trimmed.length < 3) {
        return { valid: false, message: "Participant ID must be at least 3 characters" };
    }
    
    if (trimmed.length > 20) {
        return { valid: false, message: "Participant ID must be less than 20 characters" };
    }
    
    // Check for valid characters (alphanumeric, underscore, hyphen)
    if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) {
        return { valid: false, message: "Participant ID can only contain letters, numbers, underscore, and hyphen" };
    }
    
    return { valid: true };
};

/**
 * Gets user ID for the current session (public or study)
 * This is a helper function that can be used throughout the app
 */
export const getCurrentUserId = (): number => {
    const studySession = getStudySession();
    return studySession ? studySession.userId : 1; // Default to 1 for public users
};

/**
 * Checks if the current session is a study session
 */
export const isStudyMode = (): boolean => {
    const studySession = getStudySession();
    return studySession !== null;
};
