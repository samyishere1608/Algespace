import useAxios from "axios-hooks";
import { plainToClass } from "class-transformer";
import { ReactElement, useState, useEffect } from "react";
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
import { GoalCompletionProvider } from "@/contexts/GoalCompletionContext.tsx";
import PostTaskAppraisal from "@/components/PostTaskAppraisal.tsx";
import { Agent } from "@components/flexibility/interventions/Agent.tsx";
import { AgentExpression, AgentType } from "@/types/flexibility/enums.ts";
import { EfficiencyExercise as EfficiencyExerciseProps } from "@/types/flexibility/efficiencyExercise.ts";
import { MatchingExercise as MatchingExerciseProps } from "@/types/flexibility/matchingExercise.ts";
import { TipExercise as TipExerciseProps } from "@/types/flexibility/tipExercise.ts";
import { MatchingExercise } from "@components/flexibility/exercises/MatchingExercise.tsx";
import { WorkedExamples } from "@components/flexibility/exercises/WorkedExamples.tsx";
import { TipExercise } from "@components/flexibility/exercises/TipExercise.tsx";
import { PlainExercise as PlainExerciseProps } from "@/types/flexibility/plainExercise.ts";
import { PlainExercise } from "@components/flexibility/exercises/PlainExercise.tsx";
import confetti from "canvas-confetti";
import { getStudySession } from "@/utils/studySession";

export default function FlexibilityExercise({ isStudyExample }: { isStudyExample: boolean }): ReactElement {
    const [exitOverlay, setExitOverlay] = useState<[boolean, boolean]>([false, false]);
    const location = useLocation();
    const { exerciseId } = useParams();

    const [showOverlay, setShowOverlay] = useState(true);
    const [goals, setGoals] = useState<Goal[]>([]);
    // Dynamic user ID - initialize with study session if available, otherwise default to 1
    const [userId, setUserId] = useState(() => {
        const studySession = getStudySession();
        const initialUserId = studySession?.userId || 1;
        console.log(`🔧 FlexibilityExercise initialized with userId: ${initialUserId}`);
        return initialUserId;
    });

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

    // Modal states for goal completion flow
    const [showAppraisalModal, setShowAppraisalModal] = useState(false);
    const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
    const [tempScores, setTempScores] = useState<any>(null);
    const [showCelebration, setShowCelebration] = useState(false);
    const [agentMessage, setAgentMessage] = useState<string | null>(null);

    // Auto-hide agent message after 3 seconds
    useEffect(() => {
        if (agentMessage) {
            const timer = setTimeout(() => {
                setAgentMessage(null);
            }, 3000);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [agentMessage]);

    // Note: Adaptive feedback is now handled by GoalList.tsx after goal completion

    useEffect(() => {
        console.log(`🎯 FlexibilityExercise fetching goals for userId: ${userId}`);
        fetchGoals(userId).then((fetchedGoals) => {
            console.log(`🎯 FlexibilityExercise fetched ${fetchedGoals.length} goals for userId: ${userId}`);
            setGoals(fetchedGoals);
        }).catch(console.error);
    }, [userId]);

    // Completion function for exercises - trigger the RetrospectiveModal via auto-scoring
    const exerciseCompletionFunction = (title: string) => {
        console.log(`🎯 ===== EXERCISE COMPLETION FUNCTION CALLED =====`);
        console.log(`🎯 Looking for goal with title: "${title}"`);
        console.log(`🎯 Available goals:`, goals.map(g => ({ id: g.id, title: g.title, completed: g.completed })));
        console.log(`🎯 Current overlay state: ${showOverlay}`);
        
        // Check if the goal actually exists before trying to complete it  
        const goal = goals.find(g => g.title === title && !g.completed);
        if (goal) {
            console.log(`🎯 ✅ FOUND MATCHING GOAL! Triggering auto-scoring completion for: "${title}"`);
            console.log(`🎯 Dispatching custom event with auto-scoring for goal ID: ${goal.id}`);
            
            // Create and dispatch the event
            const event = new CustomEvent('triggerGoalCompletion', { 
                detail: { goalId: goal.id, goalTitle: title } 
            });
            
            console.log(`🎯 Event created:`, event);
            console.log(`🎯 Event detail:`, event.detail);
            console.log(`🎯 About to dispatch event...`);
            
            window.dispatchEvent(event);
            
            console.log(`🎯 ✅ Event dispatched successfully!`);
            
            // Add a small delay to check if event was received
            setTimeout(() => {
                console.log(`🎯 Checking if event was processed... (1 second later)`);
            }, 1000);
            
        } else {
            console.log(`🎯 ❌ GOAL NOT FOUND: "${title}" does not exist or is already completed`);
            console.log(`🎯 Available goal titles:`, goals.map(g => g.title));
        }
    };

    // Handle PostTaskAppraisal submission
    const handleAppraisalSubmit = async (
        postSatisfaction: number,
        postConfidence: number,
        posteffort: number,
        postenjoyment: number,
        postanxiety: number
    ) => {
        if (!selectedGoalId) return;
        
        try {
            // Import the API function here to complete the goal
            const { completeGoalWithScore } = await import("@/utils/api");
            
            await completeGoalWithScore(
                selectedGoalId,
                tempScores?.actualScore || 0,
                postSatisfaction,
                postConfidence,
                posteffort,
                postenjoyment,
                postanxiety
            );
            
            // Refresh goals to show the completed goal
            const updatedGoals = await fetchGoals(userId);
            setGoals(updatedGoals);
            
            // Trigger confetti celebration animation
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#229EBC', '#007bff', '#00ff00', '#ffff00', '#ff00ff']
            });
            
            // Show celebration for high satisfaction
            if (postSatisfaction >= 4) {
                confetti({
                    particleCount: 200,
                    spread: 100,
                    origin: { y: 0.6 },
                    colors: ['#ffd700', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4']
                });
            }
            
            // Show gamified celebration text
            setShowCelebration(true);
            setTimeout(() => {
                setShowCelebration(false);
            }, 3000); // Hide after 3 seconds
            
            // Show agent congratulations message
            const celebrationMessages = [
                "🎉 Fantastic work! You've achieved your goal! Keep up the amazing effort!",
                "🌟 Outstanding! Another goal completed! You're doing brilliantly!",
                "🎯 Excellent job! You hit your target perfectly! Well done!",
                "✨ Wonderful achievement! You're making great progress!",
                "🚀 Superb! Another step closer to success! Keep going!"
            ];
            const randomMessage = celebrationMessages[Math.floor(Math.random() * celebrationMessages.length)];
            setAgentMessage(randomMessage);
            
            // ❌ REMOVED: Duplicate adaptive feedback system 
            // The GoalList.tsx now handles all adaptive feedback to prevent conflicts
            // This ensures single source of truth for adaptive messaging
            
            console.log('🎯 Goal completion processed - adaptive feedback handled by GoalList.tsx');
            
            console.log(`🎯 Goal ${selectedGoalId} marked as completed!`);
        } catch (error) {
            console.error("Failed to complete goal:", error);
        }
        
        setShowAppraisalModal(false);
        setSelectedGoalId(null);
        setTempScores(null);
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

            <button
                onClick={() => setShowOverlay(true)}
                style={{
                    position: "fixed",
                    top: "1rem",    
                    right: "1rem",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "50px",
                    height: "50px",
                    fontSize: "1.2rem",
                    cursor: "pointer",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    zIndex: 1500,
                }}
                title="View Goals"
            >
                📋
            </button>

            {/* Goal List Overlay */}
            {showOverlay && (
                <GoalListOverlay
                    goals={goals}
                    onClose={() => setShowOverlay(false)}
                    userId={userId}
                    onGoalsChange={setGoals}
                />
            )}

            {/* Goal Completion Modals - Always rendered at FlexibilityExercise level */}
            <PostTaskAppraisal
                isOpen={showAppraisalModal}
                onClose={() => {
                    setShowAppraisalModal(false);
                    setSelectedGoalId(null);
                    setTempScores(null);
                }}
                onSubmit={handleAppraisalSubmit}
            />

            {/* Gamified Goal Completion Celebration */}
            {showCelebration && (
                <div style={{
                    position: "fixed",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 10000,
                    textAlign: "center",
                    animation: "celebrationBounce 3s ease-out",
                    pointerEvents: "none"
                }}>
                    <div style={{
                        fontSize: "4rem",
                        fontWeight: "bold",
                        fontFamily: "'Comic Sans MS', cursive, sans-serif",
                        background: "linear-gradient(45deg, #ffd700, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4)",
                        backgroundSize: "400% 400%",
                        animation: "gradientShift 1s ease-in-out infinite, textGlow 1s ease-in-out infinite",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        backgroundClip: "text",
                        textShadow: "0 0 20px rgba(255, 215, 0, 0.5)",
                        filter: "drop-shadow(0 0 10px rgba(255, 215, 0, 0.8))",
                        marginBottom: "1rem"
                    }}>
                        🎉 GOAL COMPLETED! 🎉
                    </div>
                    <div style={{
                        fontSize: "2rem",
                        fontWeight: "bold",
                        fontFamily: "'Comic Sans MS', cursive, sans-serif",
                        color: "#229EBC",
                        textShadow: "0 0 10px rgba(34, 158, 188, 0.5)",
                        animation: "bounce 1s infinite"
                    }}>
                        Amazing work! 🌟
                    </div>
                </div>
            )}

            {/* CSS Animations for Celebration */}
            <style>{`
                @keyframes celebrationBounce {
                    0% {
                        transform: translate(-50%, -50%) scale(0) rotate(-180deg);
                        opacity: 0;
                    }
                    50% {
                        transform: translate(-50%, -50%) scale(1.2) rotate(0deg);
                        opacity: 1;
                    }
                    70% {
                        transform: translate(-50%, -50%) scale(0.9) rotate(0deg);
                        opacity: 1;
                    }
                    100% {
                        transform: translate(-50%, -50%) scale(1) rotate(0deg);
                        opacity: 0;
                    }
                }
                
                @keyframes gradientShift {
                    0% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                    100% { background-position: 0% 50%; }
                }
                
                @keyframes textGlow {
                    0%, 100% { filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.8)); }
                    50% { filter: drop-shadow(0 0 20px rgba(255, 215, 0, 1)) drop-shadow(0 0 30px rgba(255, 107, 107, 0.8)); }
                }
                
                @keyframes bounce {
                    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                    40% { transform: translateY(-10px); }
                    60% { transform: translateY(-5px); }
                }
            `}</style>

            {/* Agent Message for Goal Completion */}
            {agentMessage && (
                <>
                    <Agent type={AgentType.FemaleAfrican} expression={AgentExpression.Smiling} />
                    <div className="flexibility-popover agent-popover" style={{ maxWidth: "300px" }}>
                        <button 
                            className="span-button primary-button hint-popover__button" 
                            onClick={() => setAgentMessage(null)}
                        >
                            ✕
                        </button>
                        <div className="hint-popover__container agent-popover__container">
                            <p>{agentMessage}</p>
                        </div>
                    </div>
                </>
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