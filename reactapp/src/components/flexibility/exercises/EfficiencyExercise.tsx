import {ReactElement, useMemo, useState, useEffect} from "react";
import {EfficiencyExercise as EfficiencyExerciseProps} from "@/types/flexibility/efficiencyExercise.ts";
import {
    AgentCondition,
    AgentType,
    EfficiencyExerciseState,
    IsolatedIn,
    Method,
    SelectedEquation
} from "@/types/flexibility/enums.ts";
import {SelfExplanation} from "@/types/flexibility/selfExplanation.ts";
import {SubstitutionParameters} from "@/types/flexibility/substitutionParameters.ts";
import {FlexibilityEquation as FlexibilityEquationProps, FlexibilityEquation} from "@/types/math/linearEquation.ts";
import {GameError, GameErrorType} from "@/types/shared/error.ts";
import {EfficientMethodSelection} from "@components/flexibility/choice/EfficientMethodSelection.tsx";
import {SelfExplanationExercise} from "@components/flexibility/choice/SelfExplanationExercise.tsx";
import {EliminationMethod} from "@components/flexibility/elimination/EliminationMethod.tsx";
import {EqualizationMethod} from "@components/flexibility/equalization/EqualizationMethod.tsx";
import {EfficiencyExerciseEnd} from "@components/flexibility/solution/EfficiencyExerciseEnd.tsx";
import {EquationSelection} from "@components/flexibility/solution/EquationSelection.tsx";
import {FirstSolution} from "@components/flexibility/solution/FirstSolution.tsx";
import {SecondSolution} from "@components/flexibility/solution/SecondSolution.tsx";
import {SubstitutionMethod} from "@components/flexibility/substitution/SubstitutionMethod.tsx";
import {SystemTransformation} from "@components/flexibility/system/SystemTransformation.tsx";
import {determineSecondEquation} from "@utils/utils.ts";
import "@styles/flexibility/flexibility.scss";
import DebugOverlay from "@/components/debug/DebugOverlay";
import {useAuth} from "@/contexts/AuthProvider.tsx";
import useFlexibilityTracker from "@hooks/useFlexibilityTracker.ts";
import {IUser} from "@/types/studies/user.ts";
import {
    FlexibilityExerciseActionPhase,
    FlexibilityExerciseChoicePhase,
    FlexibilityExercisePhase,
    FlexibilityStudyExerciseType
} from "@/types/studies/enums.ts";
import {EliminationParameters} from "@/types/flexibility/eliminationParameters.ts";
import {getRandomAgent, setFlexibilityStudyExerciseCompleted, setPKExerciseCompleted} from "@utils/storageUtils.ts";
import { useGoalCompletion } from "@/contexts/GoalCompletionContext";
import { checkProgressiveGoals, ExerciseSession, displayProgressiveStats } from "@utils/progressiveGoalTracking.ts";
import { handleExerciseCompletion } from "@utils/autoScoring.ts";

import { useUserExerciseSession } from "@/hooks/useUserExerciseSession";
import { getCurrentUserId } from "@/utils/studySession";

export function EfficiencyExercise({ flexibilityExerciseId, exercise, condition, handleEnd, isStudy = false, studyId }: {
    flexibilityExerciseId: number,
    exercise: EfficiencyExerciseProps;
    condition: AgentCondition;
    handleEnd: () => void;
    isStudy?: boolean;
    studyId?: number;
}): ReactElement {
    const agentType: AgentType | undefined = useMemo(() => {
        if (condition !== AgentCondition.None) {
            return getRandomAgent(isStudy ? sessionStorage : localStorage);
        }
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { user } = useAuth();
    if (isStudy) {
        if (user === undefined) {
            throw new GameError(GameErrorType.AUTH_ERROR);
        }
        if (studyId === undefined) {
            throw new GameError(GameErrorType.STUDY_ID_ERROR);
        }
    }
    const {
        trackActionInPhase,
        trackChoice,
        trackType,
        trackErrorInPhase,
        trackHintsInPhase,
        setNextTrackingPhase,
        endTrackingPhase,
        endTracking,
        decideCalculationIntervention,
        decideExplainIntervention,
    } = useFlexibilityTracker(isStudy, user as IUser, studyId as number, flexibilityExerciseId, exercise.id, FlexibilityStudyExerciseType.Efficiency, performance.now(), condition, agentType, FlexibilityExercisePhase.EfficiencySelection);

    const { completeGoalByTitle } = useGoalCompletion();
    
    // User-aware exercise session tracking with specific exercise ID
    const {
        hints: totalHints,
        errors: totalErrors,
        trackHint,
        trackError,
        forceSaveSession
    } = useUserExerciseSession('efficiency', isStudy && user ? user.id : undefined, exercise.id);
    
    const [hasProvidedExplanation, setHasProvidedExplanation] = useState<boolean>(false);
    
    // Wrapper functions that combine study tracking with user-specific tracking
    const trackHintsWithCounter = (...args: Parameters<typeof trackHintsInPhase>) => {
        trackHintsInPhase(...args);
        trackHint(); // User-specific tracking
    };
    
    const trackErrorsWithCounter = (...args: Parameters<typeof trackErrorInPhase>) => {
        trackErrorInPhase(...args);
        trackError(); // User-specific tracking
    };

    const [exerciseState, setExerciseState] = useState<EfficiencyExerciseState>(EfficiencyExerciseState.MethodSelection);
    const [selectedMethod, setSelectedMethod] = useState<Method>();
    const [transformedSystem, setTransformedSystem] = useState<[FlexibilityEquation, FlexibilityEquation]>();
    const [isolatedVariables, setIsolatedVariables] = useState<[IsolatedIn, IsolatedIn]>([exercise.firstEquationIsIsolatedIn, exercise.secondEquationIsIsolatedIn]);
    const [methodApplicationResult, setMethodApplicationResult] = useState<[FlexibilityEquation, boolean]>();
    const [substitutionInfo, setSubstitutionInfo] = useState<SubstitutionParameters | undefined>();
    const [selectedEquation, setSelectedEquation] = useState<[FlexibilityEquation, SelectedEquation] | undefined>();
    const [isExerciseCompleted, setIsExerciseCompleted] = useState<boolean>(false);
    
    // Auto-close state for smart feedback tracking
    const [allFeedbackComplete, setAllFeedbackComplete] = useState<boolean>(false);
    const [retrospectiveCompleted, setRetrospectiveCompleted] = useState<boolean>(false);
    const [goalCompletionStarted, setGoalCompletionStarted] = useState<boolean>(false);
    
    // Listen for goal completion events to know when feedback is done
    useEffect(() => {
        const handleGoalFeedbackComplete = () => {
            console.log('🎯 EfficiencyExercise: Goal feedback complete event received');
            setAllFeedbackComplete(true);
        };
        
        window.addEventListener('goalFeedbackComplete', handleGoalFeedbackComplete);
        return () => window.removeEventListener('goalFeedbackComplete', handleGoalFeedbackComplete);
    }, []);

    // Listen for goal completion trigger (retrospective opening)
    useEffect(() => {
        const handleGoalCompletionTrigger = () => {
            console.log('🎯 EfficiencyExercise: Goal completion flow started - RetrospectivePrompt will open');
            setGoalCompletionStarted(true);
        };
        
        window.addEventListener('triggerGoalCompletion', handleGoalCompletionTrigger);
        return () => window.removeEventListener('triggerGoalCompletion', handleGoalCompletionTrigger);
    }, []);

    // Listen for RetrospectivePrompt completion (user clicks "Complete ✓")
    useEffect(() => {
        const handleRetrospectiveComplete = () => {
            console.log('🎯 EfficiencyExercise: RetrospectivePrompt completed - PostTaskAppraisal will open');
            setRetrospectiveCompleted(true);
        };
        
        window.addEventListener('retrospectivePromptComplete', handleRetrospectiveComplete);
        return () => window.removeEventListener('retrospectivePromptComplete', handleRetrospectiveComplete);
    }, []);

    // Auto-close when exercise completed AND retrospective completed AND all goal feedback shown
    useEffect(() => {
        if (isExerciseCompleted && retrospectiveCompleted && allFeedbackComplete) {
            console.log('🎯 EfficiencyExercise: Retrospective and all goal feedback completed, auto-closing...');
            const timer = setTimeout(() => {
                console.log('🎯 EfficiencyExercise: Auto-closing now!');
                handleEnd();
            }, 500); // Quick close after all feedback
            
            return () => clearTimeout(timer);
        }
    }, [isExerciseCompleted, retrospectiveCompleted, allFeedbackComplete, handleEnd]);

    // Fallback: Auto-close if no goals are triggered within 3 seconds 
    useEffect(() => {
        if (isExerciseCompleted) {
            console.log('🎯 EfficiencyExercise: Starting fallback timer for exercises with no goals');
            const fallbackTimer = setTimeout(() => {
                if (!goalCompletionStarted) {
                    console.log('🎯 EfficiencyExercise: No goals triggered, auto-closing immediately');
                    handleEnd();
                } else {
                    console.log('🎯 EfficiencyExercise: Goal completion started, canceling fallback timer');
                }
            }, 2000); // 2 second fallback to allow goal detection
            
            return () => clearTimeout(fallbackTimer);
        }
    }, [isExerciseCompleted, goalCompletionStarted, handleEnd]);

    let content: ReactElement;
    switch (exerciseState) {
        case EfficiencyExerciseState.MethodSelection: {
            content = (
                <EfficientMethodSelection
                    firstEquation={exercise.firstEquation}
                    secondEquation={exercise.secondEquation}
                    efficientMethods={exercise.efficientMethods}
                    transformationRequired={exercise.transformationRequired}
                    loadNextStep={handleSelection}
                    question={exercise.question}
                    agentType={agentType}
                    additionalMessage={(condition === AgentCondition.Agent || condition == AgentCondition.None) ? undefined : exercise.agentMessageForSelfExplanation}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.EfficiencySelectionActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                    trackChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.SelfExplanationChoice)}
                    trackType={(type:number) => trackType(type, FlexibilityExerciseChoicePhase.StudentTypeSelfExplanation)}
                    trackChoiceIntervention={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.SelfExplanationInterventionChoice)}
                    condition={condition}
                    decidePersonalIntervention={decideExplainIntervention}
                />
            );
            break;
        }

        case EfficiencyExerciseState.SelfExplanation: {
            const selfExplanation = exercise.selfExplanationTasks.find((task: SelfExplanation) => task.method === selectedMethod);
            if (selectedMethod === undefined || selfExplanation === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = <SelfExplanationExercise method={selectedMethod}
                                               firstEquation={exercise.firstEquation}
                                               secondEquation={exercise.secondEquation}
                                               transformationsRequired={exercise.transformationRequired}
                                               selfExplanation={selfExplanation}
                                               loadNextStep={continueAfterSelfExplanation}
                                               agentType={agentType}
                                               trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.SelfExplanationActions)}
                                               trackError={trackErrorsWithCounter}
                                               trackHints={trackHintsWithCounter}
            />;
            break;
        }

        case EfficiencyExerciseState.SystemTransformation: {
            if (selectedMethod === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <SystemTransformation
                    firstEquation={exercise.firstEquation}
                    secondEquation={exercise.secondEquation}
                    firstVariable={exercise.firstVariable}
                    secondVariable={exercise.secondVariable}
                    method={selectedMethod}
                    initialIsolatedVariables={isolatedVariables}
                    agentType={agentType}
                    loadNextStep={(transformedSystem?: [FlexibilityEquation, FlexibilityEquation], isolatedVariables?: [IsolatedIn, IsolatedIn]): void => {
                        setTransformedSystem(transformedSystem);
                        setExerciseState(() => assignStateByMethod(selectedMethod, setNextTrackingPhase));
                        if (isolatedVariables !== undefined) {
                            setIsolatedVariables(isolatedVariables);
                        }
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.TransformationActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case EfficiencyExerciseState.EqualizationMethod: {
            content = (
                <EqualizationMethod
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    agentType={agentType}
                    loadNextStep={(equation: FlexibilityEquation): void => {
                        setNextTrackingPhase(FlexibilityExercisePhase.FirstSolution);
                        const containsFirstVariable: boolean = isolatedVariables[0] !== IsolatedIn.First && isolatedVariables[0] !== IsolatedIn.SecondMultiple;
                        setMethodApplicationResult([equation, containsFirstVariable]);
                        setExerciseState(EfficiencyExerciseState.FirstSolution);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.EqualizationActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case EfficiencyExerciseState.SubstitutionMethod: {
            content = (
                <SubstitutionMethod
                    isTip={exercise.useWithTip}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    firstVariable={exercise.firstVariable}
                    secondVariable={exercise.secondVariable}
                    isolatedVariables={isolatedVariables}
                    agentType={agentType}
                    loadNextStep={(equation: FlexibilityEquation, containsFirst: boolean, params?: SubstitutionParameters): void => {
                        setNextTrackingPhase(FlexibilityExercisePhase.FirstSolution);
                        setMethodApplicationResult([equation, containsFirst]);
                        setExerciseState(EfficiencyExerciseState.FirstSolution);
                        setSubstitutionInfo(params);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.SubstitutionActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case EfficiencyExerciseState.EliminationMethod: {
            content = (
                <EliminationMethod
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    firstVariable={exercise.firstVariable}
                    secondVariable={exercise.secondVariable}
                    agentType={agentType}
                    loadPreviousStep={() => handleSelection(Method.Elimination, true)}
                    loadNextStep={(equation: FlexibilityEquation, containsFirst: boolean, _?: EliminationParameters, firstMultipliedEquation?: FlexibilityEquationProps, secondMultipliedEquation?: FlexibilityEquationProps): void => {
                        setNextTrackingPhase(FlexibilityExercisePhase.FirstSolution);
                        setMethodApplicationResult([equation, containsFirst]);
                        if (firstMultipliedEquation !== undefined) {
                            if (secondMultipliedEquation !== undefined) {
                                setTransformedSystem([firstMultipliedEquation, secondMultipliedEquation]);
                            } else {
                                const secondTransformedEquation = transformedSystem !== undefined ? transformedSystem[1] : exercise.secondEquation;
                                setTransformedSystem([firstMultipliedEquation, secondTransformedEquation]);
                            }
                        } else if (secondMultipliedEquation !== undefined) {
                            const firstTransformedEquation = transformedSystem !== undefined ? transformedSystem[0] : exercise.firstEquation;
                            setTransformedSystem([firstTransformedEquation, secondMultipliedEquation]);
                        }
                        setExerciseState(EfficiencyExerciseState.FirstSolution);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.EliminationActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case EfficiencyExerciseState.FirstSolution: {
            if (selectedMethod === undefined || methodApplicationResult === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <FirstSolution
                    method={selectedMethod}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    methodEquation={methodApplicationResult[0]}
                    variable={methodApplicationResult[1] ? exercise.firstVariable : exercise.secondVariable}
                    agentType={agentType}
                    additionalMessage={(condition === AgentCondition.Agent || condition == AgentCondition.None) ? undefined: exercise.agentMessageForFirstSolution}
                    loadNextStep={() => {
                        endTrackingPhase();
                        setExerciseState(EfficiencyExerciseState.EquationSelection);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.FirstSolutionActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                    trackChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.FirstSolutionChoice)}
                    trackInterventionChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.FirstSolutionInterventionChoice)}
                    trackType={(type:number) => trackType(type, FlexibilityExerciseChoicePhase.StudentTypeFirstSolution)}
                    condition={condition}
                    decideCalculationIntervention = {decideCalculationIntervention}
                />
            );
            break;
        }

        case EfficiencyExerciseState.EquationSelection: {
            if (selectedMethod === undefined || methodApplicationResult === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <EquationSelection
                    method={selectedMethod}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    methodEquation={methodApplicationResult[0]}
                    firstSolutionVar={methodApplicationResult[1] ? exercise.firstVariable : exercise.secondVariable}
                    otherVariable={methodApplicationResult[1] ? exercise.secondVariable : exercise.firstVariable}
                    substitutionInfo={substitutionInfo}
                    loadNextStep={(selectedEquation: SelectedEquation): void => {
                        trackActionInPhase(`${SelectedEquation[selectedEquation]}`, FlexibilityExerciseActionPhase.EquationSelection);
                        setNextTrackingPhase(FlexibilityExercisePhase.SecondSolution);
                        setExerciseState(EfficiencyExerciseState.SecondSolution);
                        determineSecondEquation(selectedEquation, setSelectedEquation, exercise, transformedSystem);
                    }}
                />
            );
            break;
        }

        case EfficiencyExerciseState.SecondSolution: {
            if (selectedMethod === undefined || methodApplicationResult === undefined || selectedEquation === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <SecondSolution
                    method={selectedMethod}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    methodEquation={methodApplicationResult[0]}
                    selectedEquation={selectedEquation[0]}
                    firstSolutionVariable={methodApplicationResult[1] ? exercise.firstVariable : exercise.secondVariable}
                    otherVariable={methodApplicationResult[1] ? exercise.secondVariable : exercise.firstVariable}
                    substitutionInfo={substitutionInfo}
                    agentType={agentType}
                    additionalMessage={(condition === AgentCondition.Agent || condition == AgentCondition.None) ? undefined : exercise.agentMessageForSecondSolution}
                    loadNextStep={() => {
                        console.log(`🔄 SecondSolution -> SystemSolution transition triggered`);
                        endTrackingPhase();
                        setExerciseState(EfficiencyExerciseState.SystemSolution);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.SecondSolutionActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                    trackChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.SecondSolutionChoice)}
                    trackInterventionChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.SecondSolutionInterventionChoice)}
                    trackType={(type: number) => trackType(type, FlexibilityExerciseChoicePhase.StudentTypeSecondSolution)}
                    condition={condition}
                    decideCalculationIntervention = {decideCalculationIntervention}
                />
            );
            break;
        }

        case EfficiencyExerciseState.SystemSolution: {
            console.log(`🎯 Rendering SystemSolution state (EfficiencyExerciseEnd)`);
            if (selectedMethod === undefined || methodApplicationResult === undefined || selectedEquation === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <EfficiencyExerciseEnd
                    method={selectedMethod}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    methodEquation={methodApplicationResult[0]}
                    selectedEquation={selectedEquation[0]}
                    firstSolutionVar={methodApplicationResult[1] ? exercise.firstVariable : exercise.secondVariable}
                    firstSolutionIsFirstVariable={methodApplicationResult[1]}
                    otherVariable={methodApplicationResult[1] ? exercise.secondVariable : exercise.firstVariable}
                    agentType={agentType}
                    loadNextStep={() => {
                        console.log(`🏁 EfficiencyExerciseEnd loadNextStep triggered`);
                        endTracking();
                        handleExerciseEnd();
                    }}
                    substitutionInfo={substitutionInfo}
                />
            );
            break;
        }
    }

    return (
        <>
            {/* DebugOverlay hidden for experiment */}
            {/* <DebugOverlay 
                hints={totalHints} 
                errors={totalErrors} 
                exerciseType="efficiency"
                method={selectedMethod ? Method[selectedMethod] : 'none'}
                userId={getCurrentUserId()}
            /> */}
            
            {/* Auto-close enabled - no manual close button needed */}
            {content}
            {/* ExerciseStatsOverlay hidden per professor's request for simplification */}
            {/* <ExerciseStatsOverlay 
                hints={totalHints} 
                errors={totalErrors} 
                exerciseName="Efficiency Exercise" 
            /> */}
        </>
    );

    function handleSelection(method: Method, selfExplain: boolean): void {
        setSelectedMethod(method);
        
        if (selfExplain) {
            setNextTrackingPhase(FlexibilityExercisePhase.SelfExplanation);
            setExerciseState(EfficiencyExerciseState.SelfExplanation);
        } else if (exercise.transformationRequired) {
            setNextTrackingPhase(FlexibilityExercisePhase.Transformation);
            setExerciseState(EfficiencyExerciseState.SystemTransformation);
        } else {
            setExerciseState(assignStateByMethod(method, setNextTrackingPhase));
        }
    }

    function continueAfterSelfExplanation(): void {
        // Track that self-explanation was completed
        setHasProvidedExplanation(true);
        
        if (exercise.transformationRequired) {
            setNextTrackingPhase(FlexibilityExercisePhase.Transformation);
            setExerciseState(EfficiencyExerciseState.SystemTransformation);
        } else {
            if (selectedMethod === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            setExerciseState(assignStateByMethod(selectedMethod, setNextTrackingPhase));
        }
    }

    async function handleExerciseEnd(): Promise<void> {
        // Mark exercise as completed to trigger auto-close logic
        setIsExerciseCompleted(true);
        
        console.log(`🏁 ===== HANDLE EXERCISE END CALLED =====`);
        console.log(`🏁 User:`, user);
        console.log(`🏁 Selected method:`, selectedMethod);
        console.log(`🏁 Has provided explanation:`, hasProvidedExplanation);
        
        // Use progressive goal tracking instead of bulk triggering
        if (selectedMethod !== undefined && selectedMethod !== null) {
            // Use the same userId as the user-aware session tracking
            const effectiveUserId = getCurrentUserId(); // This gets study session userId or defaults to 1
            console.log(`🏁 Using effectiveUserId: ${effectiveUserId} from getCurrentUserId()`);
            
            const session: ExerciseSession = {
                hints: totalHints,
                errors: totalErrors,
                method: selectedMethod.toString(),
                exerciseType: 'efficiency',
                completedWithSelfExplanation: hasProvidedExplanation
            };
            
            // Save exercise score for auto-scoring system
            console.log(`🔥🔥 ===== EFFICIENCY EXERCISE COMPLETION FUNCTION CALLED =====`);
            console.log(`💾 Saving exercise score for auto-scoring system...`);
            const exerciseScore = handleExerciseCompletion(
                effectiveUserId,
                exercise.id,
                'efficiency',
                selectedMethod.toString(),
                totalHints,
                totalErrors,
                hasProvidedExplanation
            );
            console.log(`✅ Exercise score saved:`, exerciseScore);
            
            // ✅ CRITICAL: Manually save session to sessionStorage with CURRENT data BEFORE triggering goal completion
            // The forceSaveSession() from hook might have stale data, so we save directly here
            const sessionKey = `exerciseSession_${effectiveUserId}_efficiency_${exercise.id}`;
            const sessionData = {
                hints: totalHints,
                errors: totalErrors,
                method: selectedMethod.toString(),
                exerciseType: 'efficiency',
                completedWithSelfExplanation: hasProvidedExplanation,
                timestamp: Date.now(),
                completedAt: Date.now() // For backward compatibility
            };
            sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
            console.log(`💾 Session manually saved to sessionStorage BEFORE goal completion:`, sessionKey, sessionData);
            
            const completedGoals = checkProgressiveGoals(effectiveUserId, session, completeGoalByTitle, exercise.id);
            console.log(`🎯 checkProgressiveGoals returned ${completedGoals.length} goals:`, completedGoals);
            
            // Trigger only the FIRST goal - the rest will be queued automatically
            if (completedGoals.length > 0) {
                console.log(`🎯 Triggering first goal: "${completedGoals[0]}"`);
                completeGoalByTitle(completedGoals[0]);
                
                // Queue the remaining goals
                if (completedGoals.length > 1) {
                    console.log(`🎯 Pre-queuing ${completedGoals.length - 1} additional goals:`, completedGoals.slice(1));
                    completedGoals.slice(1).forEach(goalTitle => {
                        setTimeout(() => {
                            console.log(`🎯 Queuing goal: "${goalTitle}"`);
                            completeGoalByTitle(goalTitle);
                        }, 500);
                    });
                }
            }
            
            // Display current progressive tracking stats
            displayProgressiveStats(effectiveUserId);
            
            // ✅ REMOVED immediate feedback - will show proper adaptive feedback after post-reflection
        }

        // Exercise completion is now handled manually via close button
        // Students can take their time for reflection without automatic timeout
        if (isStudy) {
            setFlexibilityStudyExerciseCompleted(studyId as number, flexibilityExerciseId);
        } else {
            setPKExerciseCompleted(flexibilityExerciseId, "flexibility-training");
        }
    }
}

function assignStateByMethod(method: Method, setNextTrackingPhase: (newPhase: FlexibilityExercisePhase) => void): EfficiencyExerciseState {
    switch (method) {
        case Method.Equalization:
            setNextTrackingPhase(FlexibilityExercisePhase.Equalization);
            return EfficiencyExerciseState.EqualizationMethod;

        case Method.Substitution:
            setNextTrackingPhase(FlexibilityExercisePhase.Substitution);
            return EfficiencyExerciseState.SubstitutionMethod;

        case Method.Elimination:
            setNextTrackingPhase(FlexibilityExercisePhase.Elimination);
            return EfficiencyExerciseState.EliminationMethod;
    }
}
