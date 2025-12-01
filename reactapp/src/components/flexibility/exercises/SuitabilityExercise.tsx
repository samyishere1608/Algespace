import {TranslationNamespaces} from "@/i18n.ts";
import {useTranslation} from "react-i18next";
import {ReactElement, useMemo, useState, useEffect} from "react";
import {EliminationParameters} from "@/types/flexibility/eliminationParameters.ts";
import {
    AgentCondition,
    AgentType,
    IsolatedIn,
    Method,
    SelectedEquation,
    SuitabilityExerciseState
} from "@/types/flexibility/enums.ts";
import {FlexibilityTranslations} from "@/types/flexibility/flexibilityTranslations.ts";
import {SubstitutionParameters} from "@/types/flexibility/substitutionParameters.ts";
import {SuitabilityExercise as SuitabilityExerciseProps} from "@/types/flexibility/suitabilityExercise.ts";
import {FlexibilityEquation, FlexibilityEquation as FlexibilityEquationProps} from "@/types/math/linearEquation.ts";
import {GameError, GameErrorType} from "@/types/shared/error.ts";
import {SuitableMethodSelection} from "@components/flexibility/choice/SuitableMethodSelection.tsx";
import {ComparisonExercise} from "@components/flexibility/comparison/ComparisonExercise.tsx";
import {ResolveConclusion} from "@components/flexibility/comparison/ResolveConclusion.tsx";
import {EliminationMethod} from "@components/flexibility/elimination/EliminationMethod.tsx";
import {EqualizationMethod} from "@components/flexibility/equalization/EqualizationMethod.tsx";
import {ComparisonIntervention} from "@components/flexibility/interventions/ComparisonIntervention.tsx";
import {EquationSelection} from "@components/flexibility/solution/EquationSelection.tsx";
import {FirstSolution} from "@components/flexibility/solution/FirstSolution.tsx";
import {SecondSolution} from "@components/flexibility/solution/SecondSolution.tsx";
import {SubstitutionMethod} from "@components/flexibility/substitution/SubstitutionMethod.tsx";
import {SystemTransformation} from "@components/flexibility/system/SystemTransformation.tsx";
import {determineSecondEquation, getTransformationStatus} from "@utils/utils.ts";
import "@styles/flexibility/flexibility.scss";
import DebugOverlay from "@/components/debug/DebugOverlay";
import {useAuth} from "@/contexts/AuthProvider.tsx";
import {IUser} from "@/types/studies/user.ts";
import {
    FlexibilityExerciseActionPhase,
    FlexibilityExerciseChoicePhase,
    FlexibilityExercisePhase,
    FlexibilityStudyExerciseType
} from "@/types/studies/enums.ts";
import useFlexibilityTracker from "@hooks/useFlexibilityTracker.ts";
import { useUserExerciseSession } from "@/hooks/useUserExerciseSession";
import {getRandomAgent, setFlexibilityStudyExerciseCompleted, setPKExerciseCompleted} from "@utils/storageUtils.ts";
import { useGoalCompletion } from "@/contexts/GoalCompletionContext";
import { checkProgressiveGoals, ExerciseSession, displayProgressiveStats } from "@utils/progressiveGoalTracking.ts";
import { handleExerciseCompletion } from "@utils/autoScoring.ts";

import { getCurrentUserId } from "@/utils/studySession";

export function SuitabilityExercise({ flexibilityExerciseId, exercise, condition, handleEnd, isStudy = false, studyId }: {
    flexibilityExerciseId: number,
    exercise: SuitabilityExerciseProps;
    condition: AgentCondition;
    handleEnd: () => void;
    isStudy?: boolean;
    studyId?: number;
}): ReactElement {
    console.log(`🎯 SuitabilityExercise loaded - flexibilityExerciseId: ${flexibilityExerciseId}`);
    const { t } = useTranslation(TranslationNamespaces.Flexibility);

    const agentType: AgentType | undefined = useMemo(() => {
        if (condition !== AgentCondition.None) {
            return getRandomAgent(isStudy ? sessionStorage : localStorage);
        }
        return undefined;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Compute agent once upon mount

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
        initializeTrackingPhase,
        trackActionInPhase,
        trackChoice,
        trackType,
        trackErrorInPhase,
        trackHintsInPhase,
        setNextTrackingPhase,
        endTrackingPhase,
        endTracking,
        decideCalculationIntervention,
        decideComparisonIntervention,
        decideResolvingIntervention

    } = useFlexibilityTracker(isStudy, user as IUser, studyId as number, flexibilityExerciseId, exercise.id, FlexibilityStudyExerciseType.Suitability, performance.now(), condition, agentType);

    const { completeGoalByTitle } = useGoalCompletion();
    
    // User-aware exercise session tracking with specific exercise ID
    const {
        hints: totalHints,
        errors: totalErrors,
        trackHint,
        trackError,
        forceSaveSession
    } = useUserExerciseSession('suitability', isStudy && user ? user.id : undefined, exercise.id);
    
    // Wrapper functions for progressive tracking
    const trackHintsWithCounter = (...args: Parameters<typeof trackHintsInPhase>) => {
        trackHintsInPhase(...args);
        trackHint(); // User-specific tracking
    };
    
    const trackErrorsWithCounter = (...args: Parameters<typeof trackErrorInPhase>) => {
        trackErrorInPhase(...args);
        trackError(); // User-specific tracking
    };

    const [exerciseState, setExerciseState] = useState<SuitabilityExerciseState>(SuitabilityExerciseState.MethodSelection);
    const [selectedMethod, setSelectedMethod] = useState<Method>();
    const [transformedSystem, setTransformedSystem] = useState<[FlexibilityEquation, FlexibilityEquation] | undefined>(undefined);
    const [transformationInfo, setTransformationInfo] = useState<[IsolatedIn, IsolatedIn]>([IsolatedIn.None, IsolatedIn.None]);
    const [isolatedVariables, setIsolatedVariables] = useState<[IsolatedIn, IsolatedIn]>([exercise.firstEquationIsIsolatedIn, exercise.secondEquationIsIsolatedIn]);
    const [methodApplicationResult, setMethodApplicationResult] = useState<[FlexibilityEquation, boolean] | undefined>(undefined);
    const [substitutionInfo, setSubstitutionInfo] = useState<SubstitutionParameters | undefined>(undefined);
    const [eliminationInfo, setEliminationInfo] = useState<EliminationParameters | undefined>(undefined);
    const [selectedEquation, setSelectedEquation] = useState<[FlexibilityEquation, SelectedEquation] | undefined>(undefined);
    const [comparisonMethod, setComparisonMethod] = useState<Method>();
    const [secondTransformedSystem, setSecondTransformedSystem] = useState<[FlexibilityEquation, FlexibilityEquation] | undefined>(undefined);
    const [isExerciseCompleted, setIsExerciseCompleted] = useState<boolean>(false);
    
    // Progressive goal tracking state
    const [hasProvidedExplanation] = useState<boolean>(false);
    
    // Auto-close state for smart feedback tracking
    const [allFeedbackComplete, setAllFeedbackComplete] = useState<boolean>(false);
    const [retrospectiveCompleted, setRetrospectiveCompleted] = useState<boolean>(false);
    const [goalCompletionStarted, setGoalCompletionStarted] = useState<boolean>(false);
    
    // Listen for goal completion events to know when feedback is done
    useEffect(() => {
        const handleGoalFeedbackComplete = () => {
            console.log('🎯 SuitabilityExercise: Goal feedback complete event received');
            setAllFeedbackComplete(true);
        };
        
        window.addEventListener('goalFeedbackComplete', handleGoalFeedbackComplete);
        return () => window.removeEventListener('goalFeedbackComplete', handleGoalFeedbackComplete);
    }, []);

    // Listen for goal completion trigger (retrospective opening)
    useEffect(() => {
        const handleGoalCompletionTrigger = () => {
            console.log('🎯 SuitabilityExercise: Goal completion flow started - RetrospectivePrompt will open');
            setGoalCompletionStarted(true);
        };
        
        window.addEventListener('triggerGoalCompletion', handleGoalCompletionTrigger);
        return () => window.removeEventListener('triggerGoalCompletion', handleGoalCompletionTrigger);
    }, []);

    // Listen for RetrospectivePrompt completion (user clicks "Complete ✓")
    useEffect(() => {
        const handleRetrospectiveComplete = () => {
            console.log('🎯 SuitabilityExercise: RetrospectivePrompt completed - PostTaskAppraisal will open');
            setRetrospectiveCompleted(true);
        };
        
        window.addEventListener('retrospectivePromptComplete', handleRetrospectiveComplete);
        return () => window.removeEventListener('retrospectivePromptComplete', handleRetrospectiveComplete);
    }, []);

    // Auto-close when exercise completed AND retrospective completed AND all goal feedback shown
    useEffect(() => {
        if (isExerciseCompleted && retrospectiveCompleted && allFeedbackComplete) {
            console.log('🎯 SuitabilityExercise: Retrospective and all goal feedback completed, auto-closing in 2 seconds...');
            const timer = setTimeout(() => {
                console.log('🎯 SuitabilityExercise: Auto-closing now!');
                handleEnd();
            }, 2000); // Brief delay after all feedback completion
            
            return () => clearTimeout(timer);
        }
    }, [isExerciseCompleted, retrospectiveCompleted, allFeedbackComplete, handleEnd]);

    // Fallback: Auto-close if no goals are triggered within 8 seconds 
    useEffect(() => {
        if (isExerciseCompleted) {
            console.log('🎯 SuitabilityExercise: Starting fallback timer for exercises with no goals');
            const fallbackTimer = setTimeout(() => {
                if (!goalCompletionStarted) {
                    console.log('🎯 SuitabilityExercise: No goals triggered, auto-closing immediately');
                    handleEnd();
                } else {
                    console.log('🎯 SuitabilityExercise: Goal completion started, canceling fallback timer');
                }
            }, 8000); // 8 seconds fallback to give enough time for any goal completion flow
            
            return () => clearTimeout(fallbackTimer);
        }
    }, [isExerciseCompleted, goalCompletionStarted, handleEnd]);

    let content: ReactElement;
    switch (exerciseState) {
        case SuitabilityExerciseState.MethodSelection: {
            content = (
                <SuitableMethodSelection
                    firstEquation={exercise.firstEquation}
                    secondEquation={exercise.secondEquation}
                    question={t(FlexibilityTranslations.SELECT_SUITABLE_INSTR)}
                    agentType={agentType}
                    loadNextStep={(method: Method): void => {
                        trackActionInPhase(`${Method[method]}`, FlexibilityExerciseActionPhase.SelectedMethod);
                        initializeTrackingPhase(FlexibilityExercisePhase.Transformation);
                        setSelectedMethod(method);
                        setExerciseState(SuitabilityExerciseState.SystemTransformation);
                    }}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case SuitabilityExerciseState.SystemTransformation: {
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
                    loadNextStep={(transformedSystem?: [FlexibilityEquation, FlexibilityEquation], isolatedVariables?: [IsolatedIn, IsolatedIn], transformationInfo?: [IsolatedIn, IsolatedIn]): void => {
                        setTransformedSystem(transformedSystem);
                        setExerciseState(() => assignStateByMethod(selectedMethod, setNextTrackingPhase));
                        if (isolatedVariables !== undefined) {
                            setIsolatedVariables(isolatedVariables);
                        }
                        if (transformationInfo !== undefined) {
                            setTransformationInfo(transformationInfo);
                        }
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.TransformationActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case SuitabilityExerciseState.EqualizationMethod: {
            content = (
                <EqualizationMethod
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    agentType={agentType}
                    loadNextStep={(equation: FlexibilityEquation): void => {
                        setNextTrackingPhase(FlexibilityExercisePhase.FirstSolution);
                        const containsFirstVariable: boolean = isolatedVariables[0] !== IsolatedIn.First && isolatedVariables[0] !== IsolatedIn.SecondMultiple;
                        setMethodApplicationResult([equation, containsFirstVariable]);
                        setExerciseState(SuitabilityExerciseState.FirstSolution);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.EqualizationActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case SuitabilityExerciseState.SubstitutionMethod: {
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
                        setExerciseState(SuitabilityExerciseState.FirstSolution);
                        setSubstitutionInfo(params);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.SubstitutionActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case SuitabilityExerciseState.EliminationMethod: {
            content = (
                <EliminationMethod
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    firstVariable={exercise.firstVariable}
                    secondVariable={exercise.secondVariable}
                    agentType={agentType}
                    loadNextStep={(resultingEquation: FlexibilityEquation, containsFirst: boolean, params?: EliminationParameters, firstMultipliedEquation?: FlexibilityEquationProps, secondMultipliedEquation?: FlexibilityEquationProps): void => {
                        setNextTrackingPhase(FlexibilityExercisePhase.FirstSolution);
                        setMethodApplicationResult([resultingEquation, containsFirst]);
                        setEliminationInfo(params);
                        if (firstMultipliedEquation !== undefined) {
                            if (secondMultipliedEquation !== undefined) {
                                setTransformedSystem([firstMultipliedEquation, secondMultipliedEquation]);
                                setTransformationInfo([getTransformationStatus(transformationInfo[0]), getTransformationStatus(transformationInfo[1])]);
                            } else {
                                const secondTransformedEquation = transformedSystem !== undefined ? transformedSystem[1] : exercise.secondEquation;
                                setTransformedSystem([firstMultipliedEquation, secondTransformedEquation]);
                                setTransformationInfo([getTransformationStatus(transformationInfo[0]), transformationInfo[1]]);
                            }
                        } else if (secondMultipliedEquation !== undefined) {
                            const firstTransformedEquation = transformedSystem !== undefined ? transformedSystem[0] : exercise.firstEquation;
                            setTransformedSystem([firstTransformedEquation, secondMultipliedEquation]);
                            setTransformationInfo([transformationInfo[0], getTransformationStatus(transformationInfo[1])]);
                        }
                        setExerciseState(SuitabilityExerciseState.FirstSolution);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.EliminationActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                />
            );
            break;
        }

        case SuitabilityExerciseState.FirstSolution: {
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
                    substitutionInfo={substitutionInfo}
                    agentType={agentType}
                    additionalMessage={(condition === AgentCondition.Agent || condition == AgentCondition.None) ? undefined: exercise.agentMessageForFirstSolution}
                    loadNextStep={() => {
                        endTrackingPhase();
                        setExerciseState(SuitabilityExerciseState.EquationSelection);
                    }}
                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.FirstSolutionActions)}
                    trackError={trackErrorsWithCounter}
                    trackHints={trackHintsWithCounter}
                    trackChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.FirstSolutionChoice)}
                    trackInterventionChoice={(choice: string) => trackChoice(choice, FlexibilityExerciseChoicePhase.FirstSolutionInterventionChoice)}
                    trackType={(type: number) => trackType(type, FlexibilityExerciseChoicePhase.StudentTypeFirstSolution)}
                    condition={condition}
                    decideCalculationIntervention = {decideCalculationIntervention}
                />
            );
            break;
        }

        case SuitabilityExerciseState.EquationSelection: {
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
                        setExerciseState(SuitabilityExerciseState.SecondSolution);
                        determineSecondEquation(selectedEquation, setSelectedEquation, exercise, transformedSystem);
                    }}
                />
            );
            break;
        }

        case SuitabilityExerciseState.SecondSolution: {
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
                        endTrackingPhase();
                        setExerciseState(SuitabilityExerciseState.SystemSolution);
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

        case SuitabilityExerciseState.SystemSolution: {
            if (selectedMethod === undefined || methodApplicationResult === undefined || selectedEquation === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            const compare: boolean = exercise.suitableMethods.includes(selectedMethod);
            const comparisonMethod: Method | undefined = compare ? exercise.comparisonMethods.find((comparison) => comparison.method !== selectedMethod)?.method : exercise.suitableMethods[0];
            if (comparisonMethod === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }

            content = (
                <ComparisonIntervention
                    selectedMethod={selectedMethod}
                    initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                    transformedSystem={transformedSystem}
                    methodEquation={methodApplicationResult[0]}
                    firstSolutionVariable={methodApplicationResult[1] ? exercise.firstVariable : exercise.secondVariable}
                    selectedEquation={selectedEquation[0]}
                    otherVariable={methodApplicationResult[1] ? exercise.secondVariable : exercise.firstVariable}
                    firstSolutionIsFirstVariable={methodApplicationResult[1]}
                    additionalMessage={(condition === AgentCondition.Agent || condition == AgentCondition.None) ? undefined: (compare ? exercise.agentMessageForComparison : exercise.agentMessageForResolving)}
                    compareMethods={compare}
                    comparisonMethod={comparisonMethod}
                    substitutionInfo={substitutionInfo}
                    agentType={agentType}
                    condition={condition}
                    decideIntervention={() => {
                        return compare ? decideComparisonIntervention() : decideResolvingIntervention(comparisonMethod);
                    }}
                    trackType={(type: number) => {
                                             if (compare) {
                                                trackType(type, FlexibilityExerciseChoicePhase.StudentTypeComparison);
                                             } else {
                                                trackType(type, FlexibilityExerciseChoicePhase.StudentTypeResolving);
                                             }
                                        }}

                    setFirstChoice={(firstChoice: boolean): void => {
                        if (firstChoice) {
                            if (compare) {
                                trackChoice(`Yes to ${Method[comparisonMethod]}`, FlexibilityExerciseChoicePhase.ComparisonChoice);
                            } else {
                                trackChoice(`Yes to ${Method[comparisonMethod]}`, FlexibilityExerciseChoicePhase.ResolvingChoice);
                            }
                        } else {
                            if (compare) {
                                trackChoice(`No to ${Method[comparisonMethod]}`, FlexibilityExerciseChoicePhase.ComparisonChoice);
                            } else {
                                trackChoice(`No to ${Method[comparisonMethod]}`, FlexibilityExerciseChoicePhase.ResolvingChoice);

                            }
                        }
                    }}
                    setSecondChoice={(secondChoice: boolean): void => {
                        if (secondChoice) {
                            if (compare) {
                                trackChoice(`Yes to ${Method[comparisonMethod]}`, FlexibilityExerciseChoicePhase.ComparisonInterventionChoice);
                            } else {
                                trackChoice(`Yes to ${Method[comparisonMethod]}`, FlexibilityExerciseChoicePhase.ResolvingInterventionChoice);
                            }
                        } else {
                            if (compare) {
                                trackChoice(`No to ${Method[comparisonMethod]}`, FlexibilityExerciseChoicePhase.ComparisonInterventionChoice);
                            } else {
                                trackChoice(`No to ${Method[comparisonMethod]}`, FlexibilityExerciseChoicePhase.ResolvingInterventionChoice);

                            }
                        }
                    }}
                    loadNextStep={(compliance: boolean): void => {
                        if (compliance) {
                            setComparisonMethod(comparisonMethod);
                            setIsolatedVariables([exercise.firstEquationIsIsolatedIn, exercise.secondEquationIsIsolatedIn]);
                            if (compare) {
                                initializeTrackingPhase(FlexibilityExercisePhase.Comparison);
                                trackActionInPhase("RESOLVE", FlexibilityExerciseActionPhase.TransformationActions);
                                setExerciseState(SuitabilityExerciseState.Comparison);
                            } else {
                                initializeTrackingPhase(FlexibilityExercisePhase.TransformationResolve);
                                trackActionInPhase("RESOLVE", FlexibilityExerciseActionPhase.TransformationActions);
                                setExerciseState(SuitabilityExerciseState.SystemTransformationOnResolve);
                            }
                        } else {
                            endTrackingPhase();
                            endTracking();
                            handleExerciseEnd();
                        }
                    }}
                />
            );
            break;
        }

        case SuitabilityExerciseState.SystemTransformationOnResolve: {
            if (comparisonMethod === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = (
                <SystemTransformation
                    firstEquation={exercise.firstEquation}
                    secondEquation={exercise.secondEquation}
                    firstVariable={exercise.firstVariable}
                    secondVariable={exercise.secondVariable}
                    method={comparisonMethod}
                    initialIsolatedVariables={isolatedVariables}
                    agentType={agentType}
                    loadNextStep={(transformedSystem?: [FlexibilityEquation, FlexibilityEquation], isolatedVariables?: [IsolatedIn, IsolatedIn]): void => {
                        setSecondTransformedSystem(transformedSystem);
                        setExerciseState(() => assignResolvingStateByMethod(comparisonMethod, setNextTrackingPhase, trackActionInPhase));
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

        case SuitabilityExerciseState.ResolveWithEqualizationMethod: {
            content =
                <EqualizationMethod initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                                    transformedSystem={secondTransformedSystem}
                                    agentType={agentType}
                                    loadNextStep={(): void => {
                                        setNextTrackingPhase(FlexibilityExercisePhase.ResolveConclusion);
                                        setExerciseState(SuitabilityExerciseState.ResolveConclusion);
                                    }}
                                    trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.EqualizationActions)}
                                    trackError={trackErrorsWithCounter}
                                    trackHints={trackHintsWithCounter}
                />;
            break;
        }

        case SuitabilityExerciseState.ResolveWithSubstitutionMethod: {
            content = <SubstitutionMethod initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                                          transformedSystem={secondTransformedSystem}
                                          firstVariable={exercise.firstVariable}
                                          secondVariable={exercise.secondVariable}
                                          isolatedVariables={isolatedVariables}
                                          agentType={agentType}
                                          loadNextStep={(): void => {
                                              setNextTrackingPhase(FlexibilityExercisePhase.ResolveConclusion);
                                              setExerciseState(SuitabilityExerciseState.ResolveConclusion);
                                          }}
                                          trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.SubstitutionActions)}
                                          trackError={trackErrorsWithCounter}
                                          trackHints={trackHintsWithCounter}
            />;
            break;
        }

        case SuitabilityExerciseState.ResolveWithEliminationMethod: {
            content = <EliminationMethod initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                                         transformedSystem={secondTransformedSystem}
                                         firstVariable={exercise.firstVariable}
                                         secondVariable={exercise.secondVariable}
                                         agentType={agentType}
                                         loadNextStep={(): void => {
                                             setNextTrackingPhase(FlexibilityExercisePhase.ResolveConclusion);
                                             setExerciseState(SuitabilityExerciseState.ResolveConclusion);
                                         }}
                                         trackAction={(action: string) => trackActionInPhase(action, FlexibilityExerciseActionPhase.EliminationActions)}
                                         trackError={trackErrorsWithCounter}
                                         trackHints={trackHintsWithCounter}
                                        />;
            break;
        }

        case SuitabilityExerciseState.ResolveConclusion: {
            if (selectedMethod === undefined || comparisonMethod === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }
            content = <ResolveConclusion initialSystem={[exercise.firstEquation, exercise.secondEquation]}
                                         firstMethod={selectedMethod}
                                         secondMethod={comparisonMethod}
                                         loadNextStep={() => {
                                             endTracking();
                                             handleExerciseEnd();
                                         }}
                                         agentType={agentType}
                                         endTrackingPhase={endTrackingPhase}
            />;
            break;
        }

        case SuitabilityExerciseState.Comparison: {
            if (selectedMethod === undefined || methodApplicationResult === undefined || comparisonMethod === undefined || selectedEquation === undefined) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }

            const comparison = exercise.comparisonMethods.find((comparison) => comparison.method === comparisonMethod);
            if (comparison === undefined || comparison.steps.length < 3) {
                throw new GameError(GameErrorType.GAME_LOGIC_ERROR);
            }

            content = (
                <ComparisonExercise
                    firstEquation={exercise.firstEquation}
                    secondEquation={exercise.secondEquation}
                    firstVariable={exercise.firstVariable}
                    secondVariable={exercise.secondVariable}
                    comparison={comparison}
                    selectedMethod={selectedMethod}
                    comparisonMethod={comparisonMethod}
                    transformedSystem={transformedSystem}
                    transformationInfo={transformationInfo}
                    methodEquation={methodApplicationResult}
                    substitutionInfo={substitutionInfo}
                    eliminationInfo={eliminationInfo}
                    selectedEquation={selectedEquation}
                    loadNextStep={() => {
                        endTracking();
                        handleExerciseEnd();
                    }}
                    agentType={agentType}
                    endTrackingPhase={endTrackingPhase}
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
                exerciseType="suitability"
                method={selectedMethod ? Method[selectedMethod] : 'none'}
                userId={getCurrentUserId()}
            />
            
            {/* Auto-close enabled - no manual close button needed */}
            {content}
            {/* ExerciseStatsOverlay hidden per professor's request for simplification */}
            {/* <ExerciseStatsOverlay 
                hints={totalHints} 
                errors={totalErrors} 
                exerciseName="Suitability Exercise" 
            /> */}
        </>
    );

    async function handleExerciseEnd(): Promise<void> {
        // Mark exercise as completed to trigger auto-close logic
        setIsExerciseCompleted(true);
        
        // Use progressive goal tracking instead of bulk triggering
        console.log(`🏁 EXERCISE COMPLETION DEBUG:`);
        console.log(`🏁 selectedMethod:`, selectedMethod);
        console.log(`🏁 user:`, user);
        console.log(`🏁 effectiveUserId will be:`, user?.id || 1);
        
        if (selectedMethod !== undefined && selectedMethod !== null) {
            // Use the same userId as the current study session or default to 1
            const effectiveUserId = getCurrentUserId();
            console.log(`🏁 SuitabilityExercise using effectiveUserId: ${effectiveUserId} from getCurrentUserId()`);
            
            const session: ExerciseSession = {
                hints: totalHints,
                errors: totalErrors,
                method: selectedMethod.toString(),
                exerciseType: 'suitability',
                completedWithSelfExplanation: hasProvidedExplanation
            };
            
            // Save exercise score for auto-scoring system
            console.log(`🔥🔥 ===== SUITABILITY EXERCISE COMPLETION FUNCTION CALLED =====`);
            console.log(`💾 Saving exercise score for auto-scoring system...`);
            const exerciseScore = handleExerciseCompletion(
                effectiveUserId,
                exercise.id,
                'suitability',
                selectedMethod.toString(),
                totalHints,
                totalErrors,
                hasProvidedExplanation
            );
            console.log(`✅ Exercise score saved:`, exerciseScore);
            
            // ✅ CRITICAL: Manually save session to sessionStorage BEFORE triggering goal completion
            // forceSaveSession() doesn't work - it saves hook's internal state which may be outdated
            const sessionKey = `exerciseSession_${effectiveUserId}_suitability_${exercise.id}`;
            const sessionData = {
                hints: totalHints,
                errors: totalErrors,
                method: selectedMethod.toString(),
                exerciseType: 'suitability',
                completedWithSelfExplanation: hasProvidedExplanation,
                timestamp: Date.now(),
                completedAt: new Date().toISOString()
            };
            sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));
            console.log(`💾 Session manually saved to sessionStorage BEFORE goal completion:`, sessionKey, sessionData);
            
            console.log(`🏁 About to call checkProgressiveGoals with session:`, session);
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
                        // Delay to ensure first modal is open before queuing others
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

function assignStateByMethod(method: Method, setNextTrackingPhase: (newPhase: FlexibilityExercisePhase) => void): SuitabilityExerciseState {
    switch (method) {
        case Method.Equalization:
            setNextTrackingPhase(FlexibilityExercisePhase.Equalization);
            return SuitabilityExerciseState.EqualizationMethod;

        case Method.Substitution:
            setNextTrackingPhase(FlexibilityExercisePhase.Substitution);
            return SuitabilityExerciseState.SubstitutionMethod;

        case Method.Elimination:
            setNextTrackingPhase(FlexibilityExercisePhase.Elimination);
            return SuitabilityExerciseState.EliminationMethod;
    }
}

function assignResolvingStateByMethod(method: Method, setNextTrackingPhase: (newPhase: FlexibilityExercisePhase) => void, trackActionInPhase: (action: string, phase: FlexibilityExerciseActionPhase) => void): SuitabilityExerciseState {
    switch (method) {
        case Method.Equalization:
            setNextTrackingPhase(FlexibilityExercisePhase.EqualizationResolve);
            trackActionInPhase("RESOLVE", FlexibilityExerciseActionPhase.EqualizationActions);
            return SuitabilityExerciseState.ResolveWithEqualizationMethod;

        case Method.Substitution:
            setNextTrackingPhase(FlexibilityExercisePhase.SubstitutionResolve);
            trackActionInPhase("RESOLVE", FlexibilityExerciseActionPhase.SubstitutionActions);
            return SuitabilityExerciseState.ResolveWithSubstitutionMethod;

        case Method.Elimination:
            setNextTrackingPhase(FlexibilityExercisePhase.EliminationResolve);
            trackActionInPhase("RESOLVE", FlexibilityExerciseActionPhase.EliminationActions);
            return SuitabilityExerciseState.ResolveWithEliminationMethod;
    }
}