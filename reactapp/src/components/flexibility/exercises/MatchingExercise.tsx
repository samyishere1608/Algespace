import { AgentCondition, AgentType, IsolatedIn, MatchingExerciseState, Method, SelectedEquation } from "@/types/flexibility/enums.ts";
import { ReactElement, useMemo, useState } from "react";
import { MatchingExercise as MatchingExerciseProps } from "@/types/flexibility/matchingExercise.ts";
import { getRandomAgent, setPKExerciseCompleted, setFlexibilityStudyExerciseCompleted } from "@utils/storageUtils.ts";
import { useAuth } from "@/contexts/AuthProvider.tsx";
import { GameError, GameErrorType } from "@/types/shared/error.ts";
import useFlexibilityTracker from "@hooks/useFlexibilityTracker.ts";
import { IUser } from "@/types/studies/user.ts";
import { FlexibilityExerciseActionPhase, FlexibilityExerciseChoicePhase, FlexibilityExercisePhase, FlexibilityStudyExerciseType } from "@/types/studies/enums.ts";
import { SystemTransformation } from "@components/flexibility/system/SystemTransformation.tsx";
import { FlexibilityEquation as FlexibilityEquationProps, FlexibilityEquation } from "@/types/math/linearEquation.ts";
import { EqualizationMethod } from "@components/flexibility/equalization/EqualizationMethod.tsx";
import { SubstitutionMethod } from "@components/flexibility/substitution/SubstitutionMethod.tsx";
import { SubstitutionParameters } from "@/types/flexibility/substitutionParameters.ts";
import { EliminationMethod } from "@components/flexibility/elimination/EliminationMethod.tsx";
import { EliminationParameters } from "@/types/flexibility/eliminationParameters.ts";
import { FirstSolution } from "@components/flexibility/solution/FirstSolution.tsx";
import { EquationSelection } from "@components/flexibility/solution/EquationSelection.tsx";
import { determineSecondEquation } from "@utils/utils.ts";
import { SecondSolution } from "@components/flexibility/solution/SecondSolution.tsx";
import { EfficiencyExerciseEnd } from "@components/flexibility/solution/EfficiencyExerciseEnd.tsx";
import { SystemSelection } from "@components/flexibility/choice/SystemSelection.tsx";
import { SelfExplanationForSystemMatching } from "@components/flexibility/choice/SelfExplanationExercise.tsx";
import { useGoalCompletion } from "@/contexts/GoalCompletionContext";
import { checkProgressiveGoals, ExerciseSession, displayProgressiveStats } from "@utils/progressiveGoalTracking.ts";
import { handleExerciseCompletion } from "@utils/autoScoring.ts";

import { getCurrentUserId } from "@/utils/studySession";
import { useUserExerciseSession } from "@/hooks/useUserExerciseSession";
import DebugOverlay from "@/components/debug/DebugOverlay";

export function MatchingExercise({ flexibilityExerciseId, exercise, condition, handleEnd, isStudy = false, studyId }: {
    flexibilityExerciseId: number,
    exercise: MatchingExerciseProps;
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
        decideExplainIntervention

    } = useFlexibilityTracker(isStudy, user as IUser, studyId as number, flexibilityExerciseId, exercise.id, FlexibilityStudyExerciseType.Matching, performance.now(), condition, agentType, FlexibilityExercisePhase.SystemSelection);

    const { completeGoalByTitle } = useGoalCompletion();
    
    // User-aware exercise session tracking with specific exercise ID
    const {
        hints: totalHints,
        errors: totalErrors,
        trackHint,
        trackError,
        forceSaveSession
    } = useUserExerciseSession('matching', isStudy && user ? user.id : undefined, exercise.id);
    
    // Wrapper functions that combine study tracking with user-specific tracking
    const trackHintsWithCounter = (...args: Parameters<typeof trackHintsInPhase>) => {
        trackHintsInPhase(...args);
        trackHint(); // User-specific tracking
    };
    
    const trackErrorsWithCounter = (...args: Parameters<typeof trackErrorInPhase>) => {
        trackErrorInPhase(...args);
        trackError(); // User-specific tracking
    };
    
    // Progressive goal tracking state
    const [hasProvidedExplanation, setHasProvidedExplanation] = useState<boolean>(false);
    const [selectedMethod, setSelectedMethod] = useState<Method>();

    const randomOrder = useMemo(() => {
        return getRandomOrder(exercise.alternativeSystems.length + 1);
    }, [exercise.alternativeSystems.length]);

    const [exerciseState, setExerciseState] = useState<MatchingExerciseState>(MatchingExerciseState.SystemSelection);
    const [transformedSystem, setTransformedSystem] = useState<[FlexibilityEquation, FlexibilityEquation]>();
    const [isolatedVariables, setIsolatedVariables] = useState<[IsolatedIn, IsolatedIn]>([exercise.firstEquationIsIsolatedIn, exercise.secondEquationIsIsolatedIn]);
    const [methodApplicationResult, setMethodApplicationResult] = useState<[FlexibilityEquation, boolean]>();
    const [substitutionInfo, setSubstitutionInfo] = useState<SubstitutionParameters | undefined>();
    const [selectedEquation, setSelectedEquation] = useState<[FlexibilityEquation, SelectedEquation] | undefined>();
    const [isExerciseCompleted, setIsExerciseCompleted] = useState<boolean>(false);

    let content: ReactElement;
    switch (exerciseState) {
        case MatchingExerciseState.SystemSelection: {
            content = (
                <SystemSelection
                    firstEquation={exercise.firstEquation}
                    secondEquation={exercise.secondEquation}
                    method={exercise.method}
                    alternativeSystems={exercise.alternativeSystems}
                    randomOrder={randomOrder}
                    loadNextStep={handleSelection}
                    question={exercise.question}
                    agentType={agentType}
                    additionalMessage={(condition === AgentCondition.Agent || condition == AgentCondition.None) ? undefined : exercise.agentMessageForSelfExplanation}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.SystemMatchingActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                    trackChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.SelfExplanationChoice)}
                    trackChoiceIntervention={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.SelfExplanationInterventionChoice)}
                    trackType={(type: number) => trackType(type, FlexibilityExerciseChoicePhase.StudentTypeSelfExplanation)}
                    condition={condition}
                    decidePersonalIntervention={decideExplainIntervention}

                />
            );
            break;
        }

        case MatchingExerciseState.SelfExplanation: {
            content = <SelfExplanationForSystemMatching
                method={exercise.method}
                firstEquation={exercise.firstEquation}
                secondEquation={exercise.secondEquation}
                alternativeSystems={exercise.alternativeSystems}
                selfExplanation={exercise.selfExplanationTask}
                loadNextStep={continueAfterSelfExplanation}
                agentType={agentType}
                trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.SelfExplanationActions)}
                trackError={trackErrorsWithCounter}
                trackHints={trackHintsWithCounter}
            />;
            break;
        }

        case MatchingExerciseState.SystemTransformation: {
            content = (
                <SystemTransformation
                    firstEquation={exercise.firstEquation}
                    secondEquation={exercise.secondEquation}
                    firstVariable={exercise.firstVariable}
                    secondVariable={exercise.secondVariable}
                    method={exercise.method}
                    initialIsolatedVariables={isolatedVariables}
                    agentType={agentType}
                    loadNextStep={(transformedSystem?: [FlexibilityEquation, FlexibilityEquation], isolatedVariables?: [IsolatedIn, IsolatedIn]): void => {
                        setTransformedSystem(transformedSystem);
                        setExerciseState(() => assignStateByMethod(exercise.method, setNextTrackingPhase));
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

        case MatchingExerciseState.EqualizationMethod: {
            content = (
                <EqualizationMethod
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    agentType={agentType}
                    loadNextStep={(equation: FlexibilityEquation): void => {
                        setNextTrackingPhase(FlexibilityExercisePhase.FirstSolution);
                        const containsFirstVariable: boolean = isolatedVariables[0] !== IsolatedIn.First && isolatedVariables[0] !== IsolatedIn.FirstMultiple;
                        setMethodApplicationResult([equation, containsFirstVariable]);
                        setExerciseState(MatchingExerciseState.FirstSolution);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.EqualizationActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case MatchingExerciseState.SubstitutionMethod: {
            content = (
                <SubstitutionMethod
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    firstVariable={exercise.firstVariable}
                    secondVariable={exercise.secondVariable}
                    isolatedVariables={isolatedVariables}
                    agentType={agentType}
                    loadNextStep={(equation: FlexibilityEquation, containsFirst: boolean, params?: SubstitutionParameters): void => {
                        setNextTrackingPhase(FlexibilityExercisePhase.FirstSolution);
                        setMethodApplicationResult([equation, containsFirst]);
                        setExerciseState(MatchingExerciseState.FirstSolution);
                        setSubstitutionInfo(params);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.SubstitutionActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case MatchingExerciseState.EliminationMethod: {
            content = (
                <EliminationMethod
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    firstVariable={exercise.firstVariable}
                    secondVariable={exercise.secondVariable}
                    agentType={agentType}
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
                        setExerciseState(MatchingExerciseState.FirstSolution);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.EliminationActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                    loadPreviousStep={()=> handleSelection(true)}
                />
            );
            break;
        }

        case MatchingExerciseState.FirstSolution: {
            if (methodApplicationResult === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <FirstSolution
                    method={exercise.method}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    methodEquation={methodApplicationResult[0]}
                    variable={methodApplicationResult[1] ? exercise.firstVariable : exercise.secondVariable}
                    agentType={agentType}
                    additionalMessage={(condition === AgentCondition.Agent || condition == AgentCondition.None) ? undefined: exercise.agentMessageForFirstSolution}
                    loadNextStep={() => {
                        endTrackingPhase();
                        setExerciseState(MatchingExerciseState.EquationSelection);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.FirstSolutionActions)}
                    trackError={trackErrorsWithCounter}
                    trackChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.FirstSolutionChoice)}
                    trackInterventionChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.FirstSolutionInterventionChoice)}
                    trackType={(type: number) => trackType(type, FlexibilityExerciseChoicePhase.StudentTypeFirstSolution)}
                    condition={condition}
                    decideCalculationIntervention = {decideCalculationIntervention}
                />
            );
            break;
        }

        case MatchingExerciseState.EquationSelection: {
            if (methodApplicationResult === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <EquationSelection
                    method={exercise.method}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    methodEquation={methodApplicationResult[0]}
                    firstSolutionVar={methodApplicationResult[1] ? exercise.firstVariable : exercise.secondVariable}
                    otherVariable={methodApplicationResult[1] ? exercise.secondVariable : exercise.firstVariable}
                    substitutionInfo={substitutionInfo}
                    loadNextStep={(selectedEquation: SelectedEquation): void => {
                        trackActionInPhase(`${SelectedEquation[selectedEquation]}`, FlexibilityExerciseActionPhase.EquationSelection);
                        setNextTrackingPhase(FlexibilityExercisePhase.SecondSolution);
                        setExerciseState(MatchingExerciseState.SecondSolution);
                        determineSecondEquation(selectedEquation, setSelectedEquation, exercise, transformedSystem);
                    }}
                />
            );
            break;
        }

        case MatchingExerciseState.SecondSolution: {
            if (methodApplicationResult === undefined || selectedEquation === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <SecondSolution
                    method={exercise.method}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    methodEquation={methodApplicationResult[0]}
                    selectedEquation={selectedEquation[0]}
                    firstSolutionVariable={methodApplicationResult[1] ? exercise.firstVariable : exercise.secondVariable}
                    otherVariable={methodApplicationResult[1] ? exercise.secondVariable : exercise.firstVariable}
                    substitutionInfo={substitutionInfo}
                    agentType={agentType}
                    additionalMessage={(condition === AgentCondition.Agent || condition == AgentCondition.None) ? undefined : exercise.agentMessageForSecondSolution }
                    loadNextStep={() => {
                        endTrackingPhase();
                        setExerciseState(MatchingExerciseState.SystemSolution);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.SecondSolutionActions)}
                    trackError={trackErrorsWithCounter}
                    trackChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.SecondSolutionChoice)}
                    trackInterventionChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.SecondSolutionInterventionChoice)}
                    trackType={(type: number) => trackType(type, FlexibilityExerciseChoicePhase.StudentTypeSecondSolution)}
                    condition={condition}
                    decideCalculationIntervention = {decideCalculationIntervention}
                />
            );
            break;
        }

        case MatchingExerciseState.SystemSolution: {
            if (methodApplicationResult === undefined || selectedEquation === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <EfficiencyExerciseEnd
                    method={exercise.method}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    methodEquation={methodApplicationResult[0]}
                    selectedEquation={selectedEquation[0]}
                    firstSolutionVar={methodApplicationResult[1] ? exercise.firstVariable : exercise.secondVariable}
                    firstSolutionIsFirstVariable={methodApplicationResult[1]}
                    otherVariable={methodApplicationResult[1] ? exercise.secondVariable : exercise.firstVariable}
                    agentType={agentType}
                    loadNextStep={() => {
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
            <DebugOverlay 
                hints={totalHints} 
                errors={totalErrors} 
                exerciseType="matching"
                method="matching"
                userId={getCurrentUserId()}
            />
            
            {/* Close Exercise Button - Only show when exercise is completed */}
            {isExerciseCompleted && (
                <button
                    onClick={handleEnd}
                    style={{
                        position: 'fixed',
                        top: '10px',
                        right: '880px',
                        backgroundColor: '#dc3545',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '12px 20px',
                        fontSize: '14px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        zIndex: 999998,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                        transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#c82333';
                        e.currentTarget.style.transform = 'scale(1.05)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#dc3545';
                        e.currentTarget.style.transform = 'scale(1)';
                    }}
                >
                    ✕ Close Exercise
                </button>
            )}
            
            {content}
            {/* ExerciseStatsOverlay hidden per professor's request for simplification */}
            {/* <ExerciseStatsOverlay 
                hints={totalHints} 
                errors={totalErrors} 
                exerciseName="Matching Exercise" 
            /> */}
        </>
    );

    function handleSelection(selfExplain: boolean): void {
        // Set the method from exercise (MatchingExercise uses a predetermined method)
        setSelectedMethod(exercise.method);
        
        if (selfExplain) {
            setNextTrackingPhase(FlexibilityExercisePhase.SelfExplanation);
            setExerciseState(MatchingExerciseState.SelfExplanation);
        } else {
            setNextTrackingPhase(FlexibilityExercisePhase.Transformation);
            setExerciseState(MatchingExerciseState.SystemTransformation);
        }
    }

    function continueAfterSelfExplanation(): void {
        // Track that self-explanation was completed
        setHasProvidedExplanation(true);
        
        setNextTrackingPhase(FlexibilityExercisePhase.Transformation);
        setExerciseState(MatchingExerciseState.SystemTransformation);
    }

    async function handleExerciseEnd(): Promise<void> {
        // Mark exercise as completed to show close button
        setIsExerciseCompleted(true);
        
        console.log(`🏁 ===== HANDLE EXERCISE END CALLED =====`);
        console.log(`🏁 User:`, user);
        console.log(`🏁 Selected method:`, selectedMethod);
        console.log(`🏁 Has provided explanation:`, hasProvidedExplanation);
        
        // Use progressive goal tracking instead of bulk triggering
        if (selectedMethod !== undefined && selectedMethod !== null) {
            // Use the same userId as the current study session or default to 1
            const effectiveUserId = getCurrentUserId();
            console.log(`🏁 MatchingExercise using effectiveUserId: ${effectiveUserId} from getCurrentUserId()`);
            
            const session: ExerciseSession = {
                hints: totalHints,
                errors: totalErrors,
                method: selectedMethod.toString(),
                exerciseType: 'matching',
                completedWithSelfExplanation: hasProvidedExplanation
            };
            
            // Save exercise score for auto-scoring system
            console.log(`🔥🔥 ===== MATCHING EXERCISE COMPLETION FUNCTION CALLED =====`);
            console.log(`💾 Saving exercise score for auto-scoring system...`);
            const exerciseScore = handleExerciseCompletion(
                effectiveUserId,
                exercise.id,
                'matching',
                selectedMethod.toString(),
                totalHints,
                totalErrors,
                hasProvidedExplanation
            );
            console.log(`✅ Exercise score saved:`, exerciseScore);
            
            // ✅ CRITICAL: Force save session to sessionStorage BEFORE triggering goal completion
            forceSaveSession();
            console.log(`💾 Session force-saved before goal completion check`);
            
            console.log(`🏁 About to call checkProgressiveGoals with session:`, session);
            checkProgressiveGoals(effectiveUserId, session, completeGoalByTitle, exercise.id);
            
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

function getRandomOrder(length: number): number[] {
    const array = Array.from({ length: length }, (_, i) => i);
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];  // Swap elements
    }
    return array;
}

function assignStateByMethod(method: Method, setNextTrackingPhase: (newPhase: FlexibilityExercisePhase) => void): MatchingExerciseState {
    switch (method) {
        case Method.Equalization:
            setNextTrackingPhase(FlexibilityExercisePhase.Equalization);
            return MatchingExerciseState.EqualizationMethod;

        case Method.Substitution:
            setNextTrackingPhase(FlexibilityExercisePhase.Substitution);
            return MatchingExerciseState.SubstitutionMethod;

        case Method.Elimination:
            setNextTrackingPhase(FlexibilityExercisePhase.Elimination);
            return MatchingExerciseState.EliminationMethod;
    }
}
