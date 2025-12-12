import useAxios from "axios-hooks";
import { plainToClass } from "class-transformer";
import { ReactElement, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { TranslationNamespaces } from "@/i18n";
import { ErrorTranslations } from "@/types/shared/errorTranslations.ts";
import { GeneralTranslations } from "@/types/shared/generalTranslations.ts";
import ErrorScreen from "@components/shared/ErrorScreen.tsx";
import { ExitExerciseOverlay } from "@components/shared/ExerciseOverlay.tsx";
import Loader from "@components/shared/Loader.tsx";
import { Paths } from "@routes/paths.ts";
import "@styles/views/flexibility.scss";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FlexibilityStudyExerciseType } from "@/types/studies/enums.ts";
import { AgentCondition, FlexibilityExerciseType } from "@/types/flexibility/enums.ts";
import { getExerciseNumber, handleNavigationClick } from "@utils/utils.ts";
import { ErrorBoundary } from "react-error-boundary";
import NavigationBar from "@components/shared/NavigationBar.tsx";
import { getCurrentLanguage } from "@/i18n.ts";
import { SuitabilityExercise as SuitabilityExerciseProps } from "@/types/flexibility/suitabilityExercise.ts";
import { SuitabilityExercise } from "@components/flexibility/exercises/SuitabilityExercise.tsx";
import { EfficiencyExercise } from "@components/flexibility/exercises/EfficiencyExercise.tsx";
import { Goal } from "@/types/goal";
import { fetchGoals } from "@/utils/api.ts";
import GoalListOverlay from "@/components/GoalListOverlay.tsx";
import GoalList from "@/components/goalsetting/GoalList.tsx";
import { GoalCompletionProvider } from "@/contexts/GoalCompletionContext.tsx";
import RetrospectiveModal from "@/components/RetrospectivePrompt.tsx";
import PostTaskAppraisal from "@/components/PostTaskAppraisal.tsx";
import { generateAdaptiveFeedback, detectPerformancePattern } from "@/utils/adaptiveFeedback";
import { logAction } from "@/utils/api";
import { getGoalTitleKey, hasGoalTranslation } from "@/utils/goalTranslations";
import AgentPopup from "@/components/PedologicalAgent";
import FemaleAfricanSmiling from "@images/flexibility/Agent 3.png";
import confetti from "canvas-confetti";

import { EfficiencyExercise as EfficiencyExerciseProps } from "@/types/flexibility/efficiencyExercise.ts";
import { MatchingExercise as MatchingExerciseProps } from "@/types/flexibility/matchingExercise.ts";
import { TipExercise as TipExerciseProps } from "@/types/flexibility/tipExercise.ts";
import { MatchingExercise } from "@components/flexibility/exercises/MatchingExercise.tsx";
import { WorkedExamples } from "@components/flexibility/exercises/WorkedExamples.tsx";
import { TipExercise } from "@components/flexibility/exercises/TipExercise.tsx";
import { PlainExercise as PlainExerciseProps } from "@/types/flexibility/plainExercise.ts";
import { PlainExercise } from "@components/flexibility/exercises/PlainExercise.tsx";
import { getStudySession } from "@/utils/studySession";

export default function FlexibilityExercise({ isStudyExample }: { isStudyExample: boolean }): ReactElement {
    const { t } = useTranslation(TranslationNamespaces.GoalSetting);
    const [exitOverlay, setExitOverlay] = useState<[boolean, boolean]>([false, false]);
    const location = useLocation();
    const { exerciseId } = useParams();

    // Helper to get translated goal title (handles old goals without translation keys)
    const getTranslatedTitle = (title: string): string => {
        if (hasGoalTranslation(title)) {
            const key = getGoalTitleKey(title);
            return t(`goal-titles.${key}`);
        }
        // For old goals without translation keys, return the original title
        return title;
    };

    const [showOverlay, setShowOverlay] = useState(false);
    const [goals, setGoals] = useState<Goal[]>([]);
    // Dynamic user ID - initialize with study session if available, otherwise default to 1
    const [userId, setUserId] = useState(() => {
        const studySession = getStudySession();
        const initialUserId = studySession?.userId || 1;
        console.log(`🔧 FlexibilityExercise initialized with userId: ${initialUserId}`);
        return initialUserId;
    });

    // Modal states for goal completion - moved from hidden GoalList to visible level
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
    const [autoCalculatedScore, setAutoCalculatedScore] = useState<number | null>(null);
    const [contributingExercises, setContributingExercises] = useState<any[] | null>(null);
    
    // PostTaskAppraisal modal state
    const [showAppraisalModal, setShowAppraisalModal] = useState(false);
    const [tempScores, setTempScores] = useState<{ actualScore: number } | null>(null);
    const [completingGoalId, setCompletingGoalId] = useState<number | null>(null);
    
    // Agent message state for adaptive feedback
    const [showCheckIn, setShowCheckIn] = useState(false);
    const [agentMessage, setAgentMessage] = useState<{ text: string; duration?: number } | null>(null);
    
    // Queue for pending goal completions
    const [isShowingFeedback, setIsShowingFeedback] = useState(false);
    const [pendingGoalQueue, setPendingGoalQueue] = useState<Array<{ goalId: number; autoScore?: number; exercises?: any[] }>>([]);
    
    // Function to handle multiple goal completions
    const handleMultipleGoalCompletions = (goalTitles: string[], completeGoalByTitle: (title: string) => void) => {
        console.log(`🎯 handleMultipleGoalCompletions called with ${goalTitles.length} goals:`, goalTitles);
        
        if (goalTitles.length === 0) return;
        
        // Trigger only the first goal immediately
        console.log(`🎯 Triggering first goal immediately: "${goalTitles[0]}"`);
        completeGoalByTitle(goalTitles[0]);
        
        // Queue the rest with a small delay to ensure first modal is open
        if (goalTitles.length > 1) {
            setTimeout(() => {
                console.log(`🎯 Now queuing remaining ${goalTitles.length - 1} goals`);
                goalTitles.slice(1).forEach(goalTitle => {
                    console.log(`🎯 Queuing: "${goalTitle}"`);
                    completeGoalByTitle(goalTitle);
                });
            }, 300); // Wait for first modal to definitely be open
        }
    };

    // Study session detection - check for study mode on component mount and periodically
    useEffect(() => {
        const checkStudySession = () => {
            const studySession = getStudySession();
            if (studySession && !isStudyExample) {
                const sessionUserId = studySession.userId;
                    
                if (sessionUserId && sessionUserId !== userId) {
                    console.log(`🔬 Study mode detected - updating userId from ${userId} to ${sessionUserId}`);
                    setUserId(sessionUserId);
                } else if (sessionUserId === userId) {
                    console.log(`🔬 Study mode active - User ID: ${sessionUserId} (already set)`);
                }
            } else if (userId !== 1) {
                console.log(`👤 No study session - resetting to public mode (User ID: 1)`);
                setUserId(1);
            } else {
                console.log(`👤 Public mode - User ID: 1 (already set)`);
            }
        };

        // Check immediately
        checkStudySession();
        
        // Also check every 2 seconds for study session changes
        const interval = setInterval(checkStudySession, 2000);
        
        return () => clearInterval(interval);
    }, [isStudyExample, userId]);

    useEffect(() => {
        console.log(`🎯 FlexibilityExercise fetching goals for userId: ${userId}`);
        fetchGoals(userId).then((fetchedGoals) => {
            console.log(`🎯 FlexibilityExercise fetched ${fetchedGoals.length} goals for userId: ${userId}`);
            console.log(`🎯 Fetched goals:`, fetchedGoals.map(g => ({ id: g.id, title: g.title, completed: g.completed })));
            console.log(`🎯 Active goals:`, fetchedGoals.filter(g => !g.completed).length);
            setGoals(fetchedGoals);
            
            // Verify hidden GoalList will get these goals
            console.log(`🎯 Goals state will be updated, hidden GoalList should receive them`);
        }).catch((error) => {
            console.error(`❌ Failed to fetch goals:`, error);
        });
    }, [userId]);

    // Debug: Monitor when goals change to ensure hidden GoalList gets them
    useEffect(() => {
        console.log(`🎯 FlexibilityExercise: goals state changed, count: ${goals.length}`);
        console.log(`🎯 Hidden GoalList should now have access to these goals`);
        if (goals.length > 0) {
            console.log(`🎯 Goals available for completion:`, goals.filter(g => !g.completed).map(g => g.title));
        }
    }, [goals]);

    // Callback to handle modal triggering at FlexibilityExercise level (visible)
    const handleModalTrigger = (goalId: number, autoScore?: number, exercises?: any[]) => {
        console.log(`🎯 ========== HANDLE MODAL TRIGGER CALLED ==========`);
        console.log(`🎯 FlexibilityExercise: Modal trigger received for goal ${goalId}`);
        console.log(`🎯 Current state - selectedGoalId: ${selectedGoalId}, showAppraisalModal: ${showAppraisalModal}, isShowingFeedback: ${isShowingFeedback}`);
        
        // If currently showing feedback OR a retrospective modal is already open, queue this goal
        // Note: We don't check showAppraisalModal here because it might not have updated yet after setState
        if (isShowingFeedback || selectedGoalId !== null) {
            console.log(`🎯 ========== ADDING TO QUEUE ==========`);
            console.log(`🎯 Currently busy (feedback: ${isShowingFeedback}, modal: ${selectedGoalId !== null}) - adding goal ${goalId} to queue`);
            setPendingGoalQueue(prev => {
                const newQueue = [...prev, { goalId, autoScore, exercises }];
                console.log(`🎯 Queue updated - new length: ${newQueue.length}`, newQueue);
                return newQueue;
            });
            return;
        }
        
        console.log(`🎯 ========== SHOWING MODAL IMMEDIATELY ==========`);
        console.log(`🎯 Setting modal state at FlexibilityExercise level (should be visible)`);
        
        // Dispatch event to notify exercises that goal completion flow has started
        console.log('🎯 Dispatching triggerGoalCompletion event for auto-close tracking');
        window.dispatchEvent(new CustomEvent('triggerGoalCompletion'));
        
        setSelectedGoalId(goalId);
        setAutoCalculatedScore(autoScore || null);
        setContributingExercises(exercises || null);
    };

    // Handle retrospective modal submission
    const handleRetrospectiveSubmit = (actualScore: number) => {
        console.log(`🎯 FlexibilityExercise: Retrospective submitted with score ${actualScore}`);
        
        if (selectedGoalId) {
            // Store the goal ID and score for PostTaskAppraisal
            setCompletingGoalId(selectedGoalId);
            setTempScores({ actualScore });
            setShowAppraisalModal(true);
            
            // Close the retrospective modal
            setSelectedGoalId(null);
            setAutoCalculatedScore(null);
            setContributingExercises(null);
            
            console.log(`🎯 Moving to PostTaskAppraisal phase for goal ID: ${selectedGoalId}`);
        }
    };

    // Handle PostTaskAppraisal submission
    const handleAppraisalSubmit = async (
        postSatisfaction: number,
        postConfidence: number,
        postEffort: number,
        postEnjoyment: number,
        postAnxiety: number
    ) => {
        if (!completingGoalId || !tempScores) return;
        
        console.log(`🎯 ========== APPRAISAL SUBMIT START ==========`);
        console.log(`🎯 Completing goal ID: ${completingGoalId}`);
        console.log(`🎯 Goal title: ${goals.find(g => g.id === completingGoalId)?.title}`);
        console.log(`🎯 Current queue length: ${pendingGoalQueue.length}`);
        console.log(`🎯 Pending goals in queue:`, pendingGoalQueue.map(g => g.goalId));
        
        // Mark that we're showing feedback now
        setIsShowingFeedback(true);
        
        try {
            console.log(`🎯 FlexibilityExercise: PostTaskAppraisal submitted for goal ID: ${completingGoalId}`);
            
            // Calculate hints and errors from exercise session data before completing the goal
            let calculatedHints = 0;
            let calculatedErrors = 0;
            
            try {
                // Import auto-scoring utilities to get exercise performance data
                const { getExerciseScores, getContributingExercises } = await import('@/utils/autoScoring');
                const currentGoal = goals.find(g => g.id === completingGoalId);
                
                if (currentGoal) {
                    const allExerciseScores = getExerciseScores(userId);
                    const contributingExercises = getContributingExercises(currentGoal.title, allExerciseScores);
                    
                    if (contributingExercises.length > 0) {
                        // ✅ FIXED: For multi-exercise goals, use TOTAL SUM not average
                        const totalHints = contributingExercises.reduce((sum, ex) => sum + ex.hints, 0);
                        const totalErrors = contributingExercises.reduce((sum, ex) => sum + ex.errors, 0);
                        
                        // Use total sum for hints
                        calculatedHints = totalHints;
                        
                        // ✅ CRITICAL: Use autoCalculatedScore for errors (same source as retrospective!)
                        if (autoCalculatedScore !== null && autoCalculatedScore !== undefined) {
                            calculatedErrors = autoCalculatedScore;
                            console.log(`🎯 ✅ Using autoCalculatedScore for errors: ${calculatedErrors} (same as retrospective)`);
                        } else {
                            // Fallback: use total sum
                            calculatedErrors = totalErrors;
                            console.warn(`⚠️ Fallback: Using calculated total errors: ${calculatedErrors}`);
                        }
                        
                        console.log(`🎯 Using TOTAL performance for multi-exercise goal: ${calculatedHints} hints, ${calculatedErrors} errors (sum, not average)`);
                    } else {
                        // For single-exercise goals, get from most recent session
                        const allSessionKeys = Object.keys(sessionStorage).filter(key => 
                            key.startsWith(`exerciseSession_${userId}_`)
                        );
                        
                        const sessionKeys = allSessionKeys.filter(key => 
                            key.includes('efficiency') || key.includes('suitability') || key.includes('matching')
                        );
                        
                        let mostRecentKey = '';
                        let mostRecentTimestamp = 0;
                        let exerciseSession = null;
                        
                        for (const key of sessionKeys) {
                            const sessionData = sessionStorage.getItem(key);
                            if (sessionData) {
                                try {
                                    const session = JSON.parse(sessionData);
                                    if (session && typeof session.hints === 'number' && typeof session.errors === 'number') {
                                        const sessionTimestamp = session.timestamp || session.completedAt || 0;
                                        if (sessionTimestamp > mostRecentTimestamp) {
                                            mostRecentKey = key;
                                            exerciseSession = session;
                                            mostRecentTimestamp = sessionTimestamp;
                                        }
                                    }
                                } catch (error) {
                                    console.warn('🎯 Failed to parse session:', key, error);
                                }
                            }
                        }
                        
                        if (exerciseSession) {
                            calculatedHints = (typeof exerciseSession.hints === 'number' && !isNaN(exerciseSession.hints)) ? 
                                             exerciseSession.hints : 0;
                            calculatedErrors = (typeof exerciseSession.errors === 'number' && !isNaN(exerciseSession.errors)) ? 
                                              exerciseSession.errors : 0;
                            console.log(`🎯 Using single session performance: ${calculatedHints} hints, ${calculatedErrors} errors`);
                        }
                    }
                }
            } catch (error) {
                console.warn('🎯 Failed to calculate hints/errors for goal completion:', error);
            }
            
            // Import the API function to complete the goal
            const { completeGoalWithScore } = await import("@/utils/api");
            
            // Call with correct parameter order: id, actualScore, hintsUsed, errorsMade, then emotional data
            await completeGoalWithScore(
                completingGoalId,
                tempScores.actualScore,
                calculatedHints,        // ← Now in correct position
                calculatedErrors,       // ← Now in correct position  
                postSatisfaction,
                postConfidence,
                postEffort,
                postEnjoyment,
                postAnxiety
            );
            
            console.log(`🎯 Goal completed with performance data: ${calculatedHints} hints, ${calculatedErrors} errors`);
            
            // Refresh goals
            const updatedGoals = await fetchGoals(userId);
            setGoals(updatedGoals);

            console.log(`🎯 Goal ${completingGoalId} completed successfully with performance: hints=${calculatedHints}, errors=${calculatedErrors}`);

            // Close the appraisal modal BEFORE generating feedback
            console.log(`🎯 Closing appraisal modal before feedback generation starts`);
            setShowAppraisalModal(false);
            setTempScores(null);
            setCompletingGoalId(null);

            // Generate adaptive feedback message
            await generateAdaptiveFeedbackForGoal(
                completingGoalId, 
                postSatisfaction, 
                postConfidence, 
                postEffort, 
                postEnjoyment, 
                postAnxiety,
                updatedGoals  // Pass updated goals to check if all completed
            );        } catch (error) {
            console.error("Failed to complete goal:", error);
            // Make sure modal is closed even if there's an error
            setShowAppraisalModal(false);
            setTempScores(null);
            setCompletingGoalId(null);
        }
    };

    const generateAdaptiveFeedbackForGoal = async (
        goalId: number,
        postSatisfaction: number,
        postConfidence: number,
        postEffort: number,
        postEnjoyment: number,
        postAnxiety: number,
        updatedGoals: Goal[]
    ) => {
        const messages: Array<{ text: string; duration?: number }> = [];
        
        try {
            console.log('🎯 Goal completed successfully - generating adaptive feedback');
            
            const currentGoal = goals.find(g => g.id === goalId);
            if (!currentGoal) {
                console.error('🎯 Goal not found for adaptive feedback:', goalId);
                return;
            }

            // Add completion celebration message first - use translated title
            const translatedTitle = t(`goal-titles.${getGoalTitleKey(currentGoal.title)}`);
            messages.push({ text: t('ui.goal-completed-message', { title: translatedTitle }), duration: 4000 });

            // Update dynamic goal suggestions based on new progress
            let updatedSuggestions: string[] = [];
            try {
                const { updateGoalSuggestions } = await import("@/utils/api");
                
                // Small delay to ensure goal completion is processed by backend before updating suggestions
                await new Promise(resolve => setTimeout(resolve, 500));
                
                updatedSuggestions = await updateGoalSuggestions(userId);
                console.log('Updated goal suggestions:', updatedSuggestions);
                
                // Dispatch a custom event to notify the parent component about updated suggestions
                window.dispatchEvent(new CustomEvent('goalSuggestionsUpdated', { 
                    detail: { suggestions: updatedSuggestions } 
                }));
            } catch (error) {
                console.error('Failed to update goal suggestions:', error);
            }

            // Add progression feedback message if suggestions were updated
            const hasSuggestionUpdates = updatedSuggestions && updatedSuggestions.length > 0;
            if (hasSuggestionUpdates) {
                console.log('🎯 Goal suggestions updated - will include progression feedback');
            }

            console.log('🎯 Goal suggestions updated - generating adaptive feedback');

            // ✅ Generate adaptive feedback using TOTAL performance data (not average)
            let totalHints: number | undefined = undefined;
            let totalErrors: number | undefined = undefined;

            // Import auto-scoring utilities
            const { getExerciseScores, getContributingExercises } = await import('@/utils/autoScoring');
            const allExerciseScores = getExerciseScores(userId);
            const contributingExercises = getContributingExercises(currentGoal.title, allExerciseScores);

            if (contributingExercises.length > 0) {
                console.log('🎯 Found', contributingExercises.length, 'contributing exercises for adaptive feedback');

                // ✅ FIXED: Calculate TOTAL (sum) not average
                const sumHints = contributingExercises.reduce((sum, ex) => sum + ex.hints, 0);
                const sumErrors = contributingExercises.reduce((sum, ex) => sum + ex.errors, 0);
                
                // Use total sum for hints
                totalHints = sumHints;
                
                // ✅ CRITICAL: Use autoCalculatedScore for errors (same source as retrospective!)
                if (autoCalculatedScore !== null && autoCalculatedScore !== undefined) {
                    totalErrors = autoCalculatedScore;
                    console.log(`🎯 ✅ Using autoCalculatedScore for errors: ${totalErrors} (same as retrospective)`);
                } else {
                    // Fallback: use total sum
                    totalErrors = sumErrors;
                    console.warn(`⚠️ Fallback: Using calculated total errors: ${totalErrors}`);
                }

                console.log('🎯 TOTAL performance data (sum, not average):', {
                    contributingCount: contributingExercises.length,
                    totalHints,
                    totalErrors
                });
            }

            // Try to find exercise session data
            let exerciseSession = null;
            const allSessionKeys = Object.keys(sessionStorage).filter(key => 
                key.startsWith(`exerciseSession_${userId}_`)
            );

            console.log('🎯 Session keys for userId', userId, ':', allSessionKeys);

            const sessionKeys = allSessionKeys.filter(key => 
                key.includes('efficiency') || key.includes('suitability') || key.includes('matching')
            );

            console.log('🎯 Filtered exercise session keys:', sessionKeys);

            let mostRecentKey = '';
            let mostRecentTimestamp = 0;

            if (sessionKeys.length > 0) {
                for (const key of sessionKeys) {
                    const sessionData = sessionStorage.getItem(key);
                    if (sessionData) {
                        try {
                            const session = JSON.parse(sessionData);
                            if (session && typeof session.hints === 'number' && typeof session.errors === 'number') {
                                const sessionTimestamp = session.timestamp || session.completedAt || 0;
                                if (sessionTimestamp > mostRecentTimestamp) {
                                    mostRecentKey = key;
                                    exerciseSession = session;
                                    mostRecentTimestamp = sessionTimestamp;
                                }
                            }
                        } catch (error) {
                            console.warn('🎯 Failed to parse session:', key, error);
                        }
                    }
                }
            }

            if (exerciseSession && mostRecentKey) {
                const actualExerciseType = mostRecentKey.includes('suitability') ? 'suitability' : 
                                         mostRecentKey.includes('matching') ? 'matching' : 'efficiency';

                const hints = (typeof exerciseSession.hints === 'number' && !isNaN(exerciseSession.hints)) ? 
                             exerciseSession.hints : 0;
                const errors = (typeof exerciseSession.errors === 'number' && !isNaN(exerciseSession.errors)) ? 
                              exerciseSession.errors : 0;

                if (hints >= 0 && errors >= 0) {
                    const sessionData = {
                        hints: hints,
                        errors: errors,
                        method: exerciseSession.method || 'substitution',
                        exerciseType: actualExerciseType,
                        completedWithSelfExplanation: exerciseSession.completedWithSelfExplanation || false
                    };

                    const emotionalData = {
                        postSatisfaction,
                        postConfidence,
                        postEffort,
                        postEnjoyment,
                        postAnxiety
                    };

                    const finalHints = totalHints !== undefined ? totalHints : sessionData.hints;
                    const finalErrors = totalErrors !== undefined ? totalErrors : sessionData.errors;

                    const feedbackData = {
                        hints: finalHints,
                        errors: finalErrors,
                        method: sessionData.method,
                        exerciseType: sessionData.exerciseType,
                        completedWithSelfExplanation: sessionData.completedWithSelfExplanation,
                        userId: userId,
                        activeGoalTitles: [currentGoal.title], // Only the goal being completed, not all active goals
                        ...emotionalData
                    };

                    const adaptiveFeedbackMessage = generateAdaptiveFeedback(feedbackData);
                    
                    // Log the detected pattern to backend for analytics
                    const detectedPattern = detectPerformancePattern(feedbackData);
                    console.log(`📊 Pattern logged: ${detectedPattern.pattern} (confidence: ${detectedPattern.confidence})`);
                    
                    try {
                        await logAction(
                            userId, 
                            'ADAPTIVE_FEEDBACK_GENERATED', 
                            `Pattern: ${detectedPattern.pattern}, Confidence: ${detectedPattern.confidence}, Hints: ${feedbackData.hints}, Errors: ${feedbackData.errors}, Goal: ${currentGoal?.title || 'N/A'}`
                        );
                    } catch (logError) {
                        console.warn('Failed to log adaptive feedback pattern:', logError);
                    }
                    
                    messages.push({ text: adaptiveFeedbackMessage, duration: 15000 }); // 15 seconds for adaptive feedback

                    // Only clear session data if there are no more pending goals in queue
                    // This ensures subsequent goals can still use the same session data
                    if (mostRecentKey && pendingGoalQueue.length === 0) {
                        sessionStorage.removeItem(mostRecentKey);
                        console.log('🧹 Cleared used session data after adaptive feedback (no more goals in queue):', mostRecentKey);
                    } else if (mostRecentKey) {
                        console.log('🎯 Keeping session data - still have', pendingGoalQueue.length, 'goals in queue');
                    }
                } else {
                    throw new Error('Invalid session data');
                }
            } else {
                // No exercise session found - use contributing exercises data if available
                console.log('🎯 No exercise session found, using contributing exercises data');

                const emotionalData = {
                    postSatisfaction,
                    postConfidence,
                    postEffort,
                    postEnjoyment,
                    postAnxiety
                };

                // Use totalHints/totalErrors from contributing exercises, or default to 0
                const finalHints = totalHints !== undefined ? totalHints : 0;
                const finalErrors = totalErrors !== undefined ? totalErrors : 0;
                
                console.log('🎯 Using contributing exercises data for feedback:', { finalHints, finalErrors });

                const feedbackData = {
                    hints: finalHints,
                    errors: finalErrors,
                    method: 'substitution',
                    exerciseType: 'efficiency',
                    completedWithSelfExplanation: false,
                    userId: userId,
                    activeGoalTitles: [currentGoal.title], // Only the goal being completed
                    ...emotionalData
                };

                const adaptiveFeedbackMessage = generateAdaptiveFeedback(feedbackData);
                
                // Log the detected pattern to backend for analytics
                const detectedPattern = detectPerformancePattern(feedbackData);
                console.log(`📊 Pattern logged: ${detectedPattern.pattern} (confidence: ${detectedPattern.confidence})`);
                
                try {
                    await logAction(
                        userId, 
                        'ADAPTIVE_FEEDBACK_GENERATED', 
                        `Pattern: ${detectedPattern.pattern}, Confidence: ${detectedPattern.confidence}, Hints: ${feedbackData.hints}, Errors: ${feedbackData.errors}, Goal: ${currentGoal?.title || 'N/A'}`
                    );
                } catch (logError) {
                    console.warn('Failed to log adaptive feedback pattern:', logError);
                }
                
                messages.push({ text: adaptiveFeedbackMessage, duration: 15000 });
            }
        } catch (error) {
            console.error('🎯 Error generating adaptive feedback:', error);
            messages.push({ text: t('ui.recommendations-updated'), duration: 4000 });
        }

        // 🎉 Confetti for every goal completion!
        setTimeout(() => {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 }
            });
        }, 500);

        // Check if all goals completed - extra celebration!
        const completedGoals = updatedGoals.filter(g => g.completed).length;
        const totalGoals = updatedGoals.length;
        const isAllCompleted = completedGoals === totalGoals && totalGoals > 0;
        
        if (isAllCompleted) {
            console.log('🎉 All goals completed! Adding celebration message');
            messages.push({ text: t('ui.all-goals-completed-message'), duration: 4000 });
            
            // Extra confetti burst for all goals done
            setTimeout(() => {
                confetti({
                    particleCount: 200,
                    spread: 90,
                    origin: { y: 0.6 }
                });
            }, 1200); // Additional celebration
        }

        // Show messages sequentially
        let delay = 0;
        messages.forEach((message) => {
            setTimeout(() => {
                setAgentMessage(message);
                setShowCheckIn(true);
            }, delay);
            delay += (message.duration || 4000) + 200; // 200ms buffer between messages
        });

        // After all feedback is shown, trigger next goal from queue
        // Use Math.max to ensure minimum delay even if no messages
        const minDelay = 2000; // Minimum 2 seconds to ensure feedback phase completes
        const totalDelay = Math.max(delay, minDelay);
        
        console.log(`🎯 Setting timeout to check queue after ${totalDelay + 1000}ms`);
        
        setTimeout(() => {
            console.log('🎯 ========== FEEDBACK COMPLETE - CHECKING QUEUE ==========');
            console.log('🎯 All goal feedback complete');
            console.log(`🎯 isShowingFeedback: ${isShowingFeedback} -> setting to false`);
            setIsShowingFeedback(false);
            
            // Check if there's a pending goal in the queue
            setPendingGoalQueue(prev => {
                console.log(`🎯 Checking queue - current length: ${prev.length}`);
                console.log(`🎯 Queue contents:`, prev);
                
                if (prev.length > 0) {
                    const nextGoal = prev[0];
                    console.log(`🎯 ========== TRIGGERING NEXT GOAL FROM QUEUE ==========`);
                    console.log(`🎯 Queue has ${prev.length} pending goals. Triggering next: ${nextGoal.goalId}`);
                    
                    // Trigger next modal immediately
                    setTimeout(() => {
                        console.log(`🎯 NOW calling handleModalTrigger for goal ${nextGoal.goalId}`);
                        handleModalTrigger(nextGoal.goalId, nextGoal.autoScore, nextGoal.exercises);
                    }, 100); // Very short delay just to ensure state updates have propagated
                    
                    return prev.slice(1); // Remove the goal we're about to trigger
                } else {
                    // No more goals in queue - NOW we can close the exercise
                    console.log('🎯 ========== NO MORE GOALS - EXERCISE CAN CLOSE ==========');
                    console.log('🎯 No more goals in queue - dispatching goalFeedbackComplete for exercise auto-close');
                    window.dispatchEvent(new CustomEvent('goalFeedbackComplete'));
                }
                return prev;
            });
        }, totalDelay + 1000); // Wait for all messages + 1 second
    };

    // Completion function for exercises - trigger the RetrospectiveModal via auto-scoring
    const exerciseCompletionFunction = (title: string) => {
        console.log(`🎯 ===== EXERCISE COMPLETION FUNCTION CALLED =====`);
        console.log(`🎯 Looking for goal with title: "${title}"`);
        console.log(`🎯 Total goals available: ${goals.length}`);
        console.log(`🎯 Available goals:`, goals.map(g => ({ id: g.id, title: g.title, completed: g.completed })));
        console.log(`🎯 Current overlay state: ${showOverlay}`);
        console.log(`🎯 Hidden GoalList should be present regardless of overlay state`);
        
        // Debug: Show unique goal titles and their counts
        const goalCounts = goals.reduce((counts, goal) => {
            counts[goal.title] = (counts[goal.title] || 0) + 1;
            return counts;
        }, {} as Record<string, number>);
        console.log(`🎯 Goal title counts:`, goalCounts);
        
        // Debug: Show active (non-completed) goals
        const activeGoals = goals.filter(g => !g.completed);
        console.log(`🎯 Active goals (${activeGoals.length}):`, activeGoals.map(g => ({ id: g.id, title: g.title })));
        
        // Check if the goal actually exists before trying to complete it  
        // Try exact match first
        let goal = goals.find(g => g.title === title && !g.completed);
        
        // If no exact match, try case-insensitive match
        if (!goal) {
            console.log(`🔍 No exact match for "${title}", trying case-insensitive match...`);
            goal = goals.find(g => g.title.toLowerCase() === title.toLowerCase() && !g.completed);
        }
        
        // If still no match, try partial matching
        if (!goal) {
            console.log(`🔍 No case-insensitive match for "${title}", trying partial match...`);
            goal = goals.find(g => g.title.toLowerCase().includes(title.toLowerCase()) && !g.completed);
        }
        
        if (goal) {
            console.log(`🎯 ✅ FOUND MATCHING GOAL! ID: ${goal.id}, Title: "${title}"`);
            console.log(`🎯 Goal details:`, goal);
            console.log(`🎯 Dispatching custom event with auto-scoring for goal ID: ${goal.id}`);
            
            // Create and dispatch the event
            const event = new CustomEvent('triggerGoalCompletion', { 
                detail: { goalId: goal.id, goalTitle: title } 
            });
            
            console.log(`🎯 Event created:`, event);
            console.log(`🎯 Event detail:`, event.detail);
            console.log(`🎯 Event type: ${event.type}`);
            console.log(`🎯 About to dispatch event to window...`);
            
            // Check if there are any event listeners
            console.log(`🎯 Checking if any listeners are registered for 'triggerGoalCompletion'`);
            
            window.dispatchEvent(event);
            
            console.log(`🎯 ✅ Event dispatched successfully to window!`);
            
            // Add a small delay to check if event was received
            setTimeout(() => {
                console.log(`🎯 POST-DISPATCH CHECK: Event should have been processed by now`);
                console.log(`🎯 If you don't see GoalList logs above, the hidden GoalList is not receiving events`);
            }, 1000);
            
        } else {
            console.log(`🎯 ❌ GOAL NOT FOUND: "${title}" does not exist or is already completed`);
            console.log(`🎯 Available goal titles:`, goals.map(g => g.title));
            console.log(`🎯 Completed goals:`, goals.filter(g => g.completed).map(g => g.title));
            
            // Try to find similar goals for better debugging
            const uniqueTitles = [...new Set(goals.map(g => g.title))];
            const similarGoals = uniqueTitles.filter(goalTitle => 
                goalTitle.toLowerCase().includes(title.toLowerCase().split(' ').slice(0, 2).join(' '))
            );
            
            if (similarGoals.length > 0) {
                console.log(`🔍 Similar goal titles found:`, similarGoals);
                console.log(`💡 The progressive system expects "${title}" but you have similar goals. This suggests a goal title mismatch.`);
            } else {
                console.log(`💡 No similar goals found for "${title}". This goal may not be in your current goal set.`);
            }
            
            // Log suggestion
            console.log(`💡 SUGGESTION: Either update the progressive system to use your actual goal titles, or ensure your goals match the expected titles.`);
        }
    };



    const concreteExerciseType: FlexibilityExerciseType | FlexibilityStudyExerciseType | undefined = location.state?.exerciseType;
    const concreteExerciseId: number | undefined = location.state?.exerciseId;

    console.log(`🎯 FlexibilityExercise loaded:`, {
        exerciseId,
        concreteExerciseType,
        concreteExerciseTypeName: concreteExerciseType !== undefined ? FlexibilityExerciseType[concreteExerciseType] : 'undefined',
        concreteExerciseId,
        locationState: location.state
    });

    if (exerciseId === undefined || exerciseId === "undefined" || concreteExerciseType === undefined || concreteExerciseId === undefined) {
        console.error(`❌ Missing required parameters:`, { exerciseId, concreteExerciseType, concreteExerciseId });
        return <ErrorScreen text={ErrorTranslations.ERROR_EXERCISE_ID} routeToReturn={Paths.FlexibilityStudyExamplesPath} showFrownIcon={true} />;
    }

    const id: number = parseInt(exerciseId);
    const currentExercise: number | undefined = getExerciseNumber(id, location.state?.exercises);

    return (
        <ErrorBoundary key={location.pathname}
                       FallbackComponent={() => <ErrorScreen text={ErrorTranslations.ERROR_RETURN} routeToReturn={Paths.FlexibilityPath} />}
        >
            <div className={"full-page"} style={{ 
                background: "linear-gradient(180deg, var(--blue-background) 0%, #044a6d 100%)", 
                paddingBottom: "1rem"
            }}>
                <NavigationBar mainRoute={GeneralTranslations.FLEXIBILITY_TRAINING}
                               handleSelection={isStudyExample ? undefined : (isHome: boolean) => handleNavigationClick(isHome, setExitOverlay)}
                               currentExercise={currentExercise} isStudy={isStudyExample} exercisesCount={location.state?.exercises?.length ?? undefined}
                               style={{ minHeight: "3.5rem" }} />
                <div className={"flexibility-view__container"}>
                    <div className={"flexibility-view__contents"}>
                        {isStudyExample ?
                            <ExampleExercise concreteExerciseType={concreteExerciseType as FlexibilityStudyExerciseType} concreteExerciseId={concreteExerciseId}
                                             flexibilityId={id} navigateBackTo={Paths.FlexibilityStudyExamplesPath} exerciseCompletionFunction={exerciseCompletionFunction} /> :
                            <Exercise concreteExerciseType={concreteExerciseType as FlexibilityExerciseType} concreteExerciseId={concreteExerciseId} flexibilityId={id}
                                      navigateBackTo={Paths.FlexibilityPath} exerciseCompletionFunction={exerciseCompletionFunction} />
                        }
                    </div>
                </div>
            </div>

            {/* Toggle Goals Overlay Button */}
            <button
                onClick={() => setShowOverlay(!showOverlay)}
                style={{
                    position: "fixed",
                    top: "1rem",    
                    right: "1rem",
                    backgroundColor: showOverlay ? "#28a745" : "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    zIndex: 1500,
                    transition: "all 0.3s ease",
                }}
                title={showOverlay ? "Hide Goals" : "View Goals"}
            >
                {showOverlay ? "👁️" : "📋"}
            </button>



            {/* Hidden GoalList for event listeners - modals rendered at FlexibilityExercise level */}
            <div style={{ 
                position: "fixed", 
                top: "-9999px", 
                left: "-9999px", 
                visibility: "hidden",
                pointerEvents: "none",
                width: "1px",
                height: "1px"
            }}>
                <GoalList 
                    goals={goals} 
                    onGoalsChange={setGoals} 
                    userId={userId}
                    showOnlyActive={true} 
                    compact={true}
                    onModalTrigger={handleModalTrigger}
                />
            </div>

            {/* Goal List Overlay - Pure Visual */}
            {showOverlay && (
                <GoalListOverlay
                    goals={goals}
                    onClose={() => setShowOverlay(false)}
                    userId={userId}
                    onGoalsChange={setGoals}
                />
            )}

            {/* RetrospectiveModal rendered at FlexibilityExercise level - VISIBLE */}
            <RetrospectiveModal
                isOpen={selectedGoalId !== null}
                onClose={() => {
                    console.log(`🎯 FlexibilityExercise: RetrospectiveModal closed`);
                    setSelectedGoalId(null);
                    setAutoCalculatedScore(null);
                    setContributingExercises(null);
                }}
                onSubmit={handleRetrospectiveSubmit}
                goalTitle={selectedGoalId ? goals.find(g => g.id === selectedGoalId)?.title : undefined}
                autoCalculatedScore={autoCalculatedScore || undefined}
                expectedMistakes={selectedGoalId ? goals.find(g => g.id === selectedGoalId)?.expectedMistakes : undefined}
                contributingExercises={contributingExercises || undefined}
            />

            {/* PostTaskAppraisal rendered at FlexibilityExercise level - VISIBLE */}
            <PostTaskAppraisal
                isOpen={showAppraisalModal}
                onClose={() => {
                    console.log(`🎯 FlexibilityExercise: PostTaskAppraisal closed`);
                    setShowAppraisalModal(false);
                    setTempScores(null);
                    setCompletingGoalId(null);
                }}
                onSubmit={handleAppraisalSubmit}
                goalName={completingGoalId ? getTranslatedTitle(goals.find(g => g.id === completingGoalId)?.title || '') : undefined}
            />

            {/* Agent popup for adaptive feedback */}
            {showCheckIn && agentMessage && (
                <AgentPopup
                    message={agentMessage.text}
                    image={FemaleAfricanSmiling}
                    onClose={() => {
                        setShowCheckIn(false);
                        setAgentMessage(null);
                    }}
                    duration={agentMessage.duration || 4000}
                />
            )}

            {!isStudyExample && exitOverlay[0] &&
                <ExitExerciseOverlay returnToHome={exitOverlay[1]} routeToReturn={Paths.FlexibilityPath} closeOverlay={() => setExitOverlay([false, false])} />}
        </ErrorBoundary>
    );
}

function Exercise({ concreteExerciseType, concreteExerciseId, flexibilityId, navigateBackTo, exerciseCompletionFunction }: {
    concreteExerciseType: FlexibilityExerciseType,
    concreteExerciseId: number;
    flexibilityId: number;
    navigateBackTo: string;
    exerciseCompletionFunction: (title: string) => void;
}): ReactElement {
    console.log(`🔍 Exercise component - Type: ${concreteExerciseType}, ID: ${concreteExerciseId}, FlexibilityID: ${flexibilityId}`);
    console.log(`🔍 Exercise type enum value:`, FlexibilityExerciseType[concreteExerciseType]);
    console.log(`🔍 Full enum mapping:`, FlexibilityExerciseType);
    
    switch (concreteExerciseType) {
        case FlexibilityExerciseType.Suitability :
            console.log(`✅ Rendering Suitability exercise`);
            return <ExerciseForSuitability concreteExerciseId={concreteExerciseId} flexibilityId={flexibilityId} navigateBackTo={navigateBackTo} exerciseCompletionFunction={exerciseCompletionFunction} />;
        case FlexibilityExerciseType.Efficiency:
            console.log(`✅ Rendering Efficiency exercise`);
            return <ExerciseForEfficiency concreteExerciseId={concreteExerciseId} flexibilityId={flexibilityId} navigateBackTo={navigateBackTo} exerciseCompletionFunction={exerciseCompletionFunction} />;
        case FlexibilityExerciseType.Matching:
            console.log(`✅ Rendering Matching exercise`);
            return <ExerciseForMatching concreteExerciseId={concreteExerciseId} flexibilityId={flexibilityId} navigateBackTo={navigateBackTo} exerciseCompletionFunction={exerciseCompletionFunction} />;
        default:
            console.error(`❌ Unknown exercise type: ${concreteExerciseType} (${FlexibilityExerciseType[concreteExerciseType]})`);
            return <ErrorScreen text={`Unknown exercise type: ${concreteExerciseType}`} routeToReturn={Paths.FlexibilityPath} showFrownIcon={true} />;
    }
}

function ExampleExercise({ concreteExerciseType, concreteExerciseId, flexibilityId, navigateBackTo, exerciseCompletionFunction }: {
    concreteExerciseType: FlexibilityStudyExerciseType,
    concreteExerciseId: number;
    flexibilityId: number;
    navigateBackTo: string;
    exerciseCompletionFunction: (title: string) => void;
}): ReactElement {
    const navigate = useNavigate();

    switch (concreteExerciseType) {
        case FlexibilityStudyExerciseType.WorkedExamples:
            return <WorkedExamples flexibilityExerciseId={flexibilityId} exerciseId={0} condition={AgentCondition.MotivationalAgent}
                                   handleEnd={() => navigate(navigateBackTo)} />;
        case FlexibilityStudyExerciseType.Suitability :
            return <ExerciseForSuitability concreteExerciseId={concreteExerciseId} flexibilityId={flexibilityId} navigateBackTo={navigateBackTo} exerciseCompletionFunction={exerciseCompletionFunction} />;
        case FlexibilityStudyExerciseType.Efficiency:
            return <ExerciseForEfficiency concreteExerciseId={concreteExerciseId} flexibilityId={flexibilityId} navigateBackTo={navigateBackTo} exerciseCompletionFunction={exerciseCompletionFunction} />;
        case FlexibilityStudyExerciseType.Matching:
            return <ExerciseForMatching concreteExerciseId={concreteExerciseId} flexibilityId={flexibilityId} navigateBackTo={navigateBackTo} exerciseCompletionFunction={exerciseCompletionFunction} />;
        case FlexibilityStudyExerciseType.TipExercise:
            return <ExerciseWithTip concreteExerciseId={concreteExerciseId} flexibilityId={flexibilityId} navigateBackTo={navigateBackTo} exerciseCompletionFunction={exerciseCompletionFunction} />;
        case FlexibilityStudyExerciseType.PlainExercise:
            return <PlainExerciseForStudy concreteExerciseId={concreteExerciseId} flexibilityId={flexibilityId} navigateBackTo={navigateBackTo} />;
    }
}

function ExerciseForSuitability({ concreteExerciseId, flexibilityId, navigateBackTo, exerciseCompletionFunction }: {
    concreteExerciseId: number,
    flexibilityId: number,
    navigateBackTo: string;
    exerciseCompletionFunction: (title: string) => void;
}): ReactElement {
    const navigate = useNavigate();

    const [{ data, loading, error }] = useAxios({
        url: `/flexibility-training/${getCurrentLanguage()}/getSuitabilityExercise/${concreteExerciseId}`
    });

    if (loading) return <Loader />;
    if (error) {
        console.error(error);
        return <ErrorScreen text={ErrorTranslations.ERROR_LOAD} routeToReturn={Paths.FlexibilityStudyExamplesPath} showFrownIcon={true} />;
    }

    const exercise: SuitabilityExerciseProps = plainToClass(SuitabilityExerciseProps, data as SuitabilityExerciseProps);

    return (
        <GoalCompletionProvider completeGoalByTitle={exerciseCompletionFunction}>
            <SuitabilityExercise flexibilityExerciseId={flexibilityId} exercise={exercise} condition={AgentCondition.MotivationalAgent}
                                handleEnd={() => navigate(navigateBackTo)} />
        </GoalCompletionProvider>
    );
}

function ExerciseForEfficiency({ concreteExerciseId, flexibilityId, navigateBackTo, exerciseCompletionFunction }: {
    concreteExerciseId: number,
    flexibilityId: number,
    navigateBackTo: string;
    exerciseCompletionFunction: (title: string) => void;
}): ReactElement {
    const navigate = useNavigate();

    const [{ data, loading, error }] = useAxios({
        url: `/flexibility-training/${getCurrentLanguage()}/getEfficiencyExercise/${concreteExerciseId}`
    });

    if (loading) return <Loader />;
    if (error) {
        console.error(error);
        return <ErrorScreen text={ErrorTranslations.ERROR_LOAD} routeToReturn={Paths.FlexibilityStudyExamplesPath} showFrownIcon={true} />;
    }

    const exercise: EfficiencyExerciseProps = plainToClass(EfficiencyExerciseProps, data as EfficiencyExerciseProps);

    return (
        <GoalCompletionProvider completeGoalByTitle={exerciseCompletionFunction}>
            <EfficiencyExercise flexibilityExerciseId={flexibilityId} exercise={exercise} condition={AgentCondition.MotivationalAgent}
                               handleEnd={() => navigate(navigateBackTo)} />
        </GoalCompletionProvider>
    );
}

function ExerciseForMatching({ concreteExerciseId, flexibilityId, navigateBackTo, exerciseCompletionFunction }: {
    concreteExerciseId: number,
    flexibilityId: number,
    navigateBackTo: string;
    exerciseCompletionFunction: (title: string) => void;
}): ReactElement {
    const navigate = useNavigate();

    const [{ data, loading, error }] = useAxios({
        url: `/flexibility-training/${getCurrentLanguage()}/getMatchingExercise/${concreteExerciseId}`
    });

    if (loading) return <Loader />;
    if (error) {
        console.error(error);
        return <ErrorScreen text={ErrorTranslations.ERROR_LOAD} routeToReturn={Paths.FlexibilityStudyExamplesPath} showFrownIcon={true} />;
    }

    const exercise: MatchingExerciseProps = plainToClass(MatchingExerciseProps, data as MatchingExerciseProps);

    return (
        <GoalCompletionProvider completeGoalByTitle={exerciseCompletionFunction}>
            <MatchingExercise flexibilityExerciseId={flexibilityId} exercise={exercise} condition={AgentCondition.MotivationalAgent}
                             handleEnd={() => navigate(navigateBackTo)} isStudy={false} studyId={1} />
        </GoalCompletionProvider>
    );
}

function ExerciseWithTip({ concreteExerciseId, flexibilityId, navigateBackTo, exerciseCompletionFunction }: {
    concreteExerciseId: number,
    flexibilityId: number,
    navigateBackTo: string;
    exerciseCompletionFunction: (title: string) => void;
}): ReactElement {
    const navigate = useNavigate();

    const [{ data, loading, error }] = useAxios({
        url: `/flexibility-training/${getCurrentLanguage()}/getTipExercise/${concreteExerciseId}`
    });

    if (loading) return <Loader />;
    if (error) {
        console.error(error);
        return <ErrorScreen text={ErrorTranslations.ERROR_LOAD} routeToReturn={Paths.FlexibilityStudyExamplesPath} showFrownIcon={true} />;
    }

    const exercise: TipExerciseProps = plainToClass(TipExerciseProps, data as TipExerciseProps);

    return (
        <GoalCompletionProvider completeGoalByTitle={exerciseCompletionFunction}>
            <TipExercise flexibilityExerciseId={flexibilityId} exercise={exercise} condition={AgentCondition.MotivationalAgent}
                        handleEnd={() => navigate(navigateBackTo)} />
        </GoalCompletionProvider>
    );
}

function PlainExerciseForStudy({ concreteExerciseId, flexibilityId, navigateBackTo }: {
    concreteExerciseId: number,
    flexibilityId: number,
    navigateBackTo: string
}): ReactElement {
    const navigate = useNavigate();

    const [{ data, loading, error }] = useAxios({
        url: `/flexibility-training/${getCurrentLanguage()}/getPlainExercise/${concreteExerciseId}`
    });

    if (loading) return <Loader />;
    if (error) {
        console.error(error);
        return <ErrorScreen text={ErrorTranslations.ERROR_LOAD} routeToReturn={Paths.FlexibilityStudyExamplesPath} showFrownIcon={true} />;
    }

    const exercise: PlainExerciseProps = plainToClass(PlainExerciseProps, data as PlainExerciseProps);

    return <PlainExercise flexibilityExerciseId={flexibilityId} exercise={exercise} condition={AgentCondition.MotivationalAgent}
                          handleEnd={() => navigate(navigateBackTo)} />;
}