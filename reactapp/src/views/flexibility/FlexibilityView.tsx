import { TranslationNamespaces } from "@/i18n.ts";
import React, { ReactElement, useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { GeneralTranslations } from "@/types/shared/generalTranslations.ts";
import { Paths } from "@routes/paths.ts";
import { getCompletedPKExercises, setCollapsibleState } from "@utils/storageUtils.ts";
import ViewLayout from "@components/views/ViewLayout.tsx";
import { useNavigate } from "react-router-dom";
import useAxios from "axios-hooks";
import Loader from "@components/shared/Loader.tsx";
import { ErrorTranslations } from "@/types/shared/errorTranslations.ts";
import { FlexibilityExerciseResponse } from "@/types/flexibility/flexibilityExerciseResponse.ts";
import { isExerciseCompleted } from "@utils/utils.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronRight } from "@fortawesome/free-solid-svg-icons";
import { Collapsible } from "@components/views/CollapsibleExerciseList.tsx";
import { FlexibilityExerciseType } from "@/types/flexibility/enums.ts";
import GoalOverlay from "@/components/Goaloverlay";
import { logAction } from "@/utils/api";
import { StudySession, getStudySession, createStudySession, clearStudySession, validateParticipantId } from "@/utils/studySession";
import { displayProgressiveStats } from "@/utils/progressiveGoalTracking";

export default function FlexibilityView(): ReactElement {
    const { t } = useTranslation(TranslationNamespaces.General);
    const [showGoalOverlay, setShowGoalOverlay] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const [showStudyLogin, setShowStudyLogin] = useState(false);
    const [studySession, setStudySession] = useState<StudySession | null>(null);
    const [loginError, setLoginError] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);

    // Check for existing study session on component mount
    useEffect(() => {
        const existingSession = getStudySession();
        if (existingSession) {
            setStudySession(existingSession);
        }
    }, []);

    // Study session handlers
    const handleStudyLogin = async (participantId: string) => {
        setLoginError("");
        setIsLoading(true);
        
        const validation = validateParticipantId(participantId);
        if (!validation.valid) {
            setLoginError(validation.message || "Invalid participant ID");
            setIsLoading(false);
            return;
        }

        try {
            const newSession = await createStudySession(participantId);
            setStudySession(newSession);
            setShowStudyLogin(false);
            
            // Log the study session creation
            await logAction(newSession.userId, 'study_session_created', 
                `Participant ${newSession.participantId} started study session with ID ${newSession.sessionId}`);
        } catch (error) {
            console.error('Error creating study session:', error);
            setLoginError("Failed to authenticate with backend. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        if (studySession) {
            // Log the session end
            logAction(studySession.userId, 'study_session_ended', 
                `Participant ${studySession.participantId} ended study session ${studySession.sessionId} after ${Math.round((new Date().getTime() - new Date(studySession.loginTime).getTime()) / 1000 / 60)} minutes`);
            
            clearStudySession();
            setStudySession(null);
        }
    };

    const flexibility: string = "flexibility-training";
    const storageKey: string = "pk-open";

    const exerciseList: ReactElement = <ExerciseList completedExercises={getCompletedPKExercises("flexibility-training")} />;
    const contents: ReactElement = (
        <React.Fragment>
            <p>{t(GeneralTranslations.FLEXIBILITY_TRAINING_INFO)}</p>
            <Collapsible text={t(GeneralTranslations.HEADER_FLEXIBILITY_TRAINING)} children={exerciseList} isOpen={true}
                         handleClick={(isOpen: boolean) => setCollapsibleState(flexibility, storageKey, isOpen)} />
        </React.Fragment>
    );

    return (
        <>
            {/* Study Mode Banner */}
            <div style={{
                padding: "1rem",
                backgroundColor: studySession ? "#e8f5e8" : "#f8f9fa",
                borderBottom: "2px solid #dee2e6",
                textAlign: "center",
                boxShadow: "0 2px 4px rgba(0,0,0,0.1)"
            }}>
                {studySession ? (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                        <span style={{ color: "#28a745", fontWeight: "bold", fontSize: "1.1rem" }}>
                            🔬 Study Mode Active - Participant: {studySession.participantId} (ID: {studySession.userId})
                        </span>
                        <button 
                            onClick={handleLogout}
                            style={{
                                padding: "0.5rem 1rem",
                                backgroundColor: "#dc3545",
                                color: "white",
                                border: "none",
                                borderRadius: "6px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                boxShadow: "0 2px 4px rgba(220,53,69,0.3)",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#c82333";
                                e.currentTarget.style.transform = "translateY(-1px)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#dc3545";
                                e.currentTarget.style.transform = "translateY(0)";
                            }}
                        >
                            End Study Session
                        </button>
                    </div>
                ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "1rem" }}>
                        <span style={{ color: "#6c757d", fontSize: "1rem" }}>
                            👤 Public Training Mode - All users share anonymous data
                        </span>
                        <button 
                            onClick={() => setShowStudyLogin(true)}
                            style={{
                                padding: "0.75rem 1.5rem",
                                backgroundColor: "#007bff",
                                color: "white",
                                border: "none",
                                borderRadius: "8px",
                                cursor: "pointer",
                                fontWeight: "bold",
                                fontSize: "1rem",
                                boxShadow: "0 3px 6px rgba(0,123,255,0.3)",
                                transition: "all 0.2s ease"
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = "#0056b3";
                                e.currentTarget.style.transform = "translateY(-2px)";
                                e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,123,255,0.4)";
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = "#007bff";
                                e.currentTarget.style.transform = "translateY(0)";
                                e.currentTarget.style.boxShadow = "0 3px 6px rgba(0,123,255,0.3)";
                            }}
                        >
                            🔬 Join Research Study
                        </button>
                    </div>
                )}
            </div>

            <ViewLayout title={GeneralTranslations.FLEXIBILITY_TRAINING} children={contents} />

            {/* Floating Goal Button with Tooltip */}
            <div style={{ position: "fixed", bottom: "2rem", right: "2rem", zIndex: 1000 }}>
                {/* Tooltip */}
                {showTooltip && (
                    <div style={{
                        position: "absolute",
                        bottom: "80px",
                        right: "20px",
                        background: "linear-gradient(135deg, #ff6b6b, #ff8e8e)",
                        color: "white",
                        padding: "0.75rem 1rem",
                        borderRadius: "15px",
                        fontSize: "0.9rem",
                        fontFamily: "'Comic Sans MS', cursive, sans-serif",
                        fontWeight: "bold",
                        boxShadow: "0 8px 20px rgba(255, 107, 107, 0.4)",
                        whiteSpace: "nowrap",
                        transform: "translateX(0)",
                        border: "2px solid rgba(255, 255, 255, 0.3)",
                        animation: "tooltipBounce 0.3s ease-out"
                    }}>
                        🌟 Set your learning goals here! 🚀
                        {/* Arrow pointing down */}
                        <div style={{
                            position: "absolute",
                            top: "100%",
                            right: "25px",
                            width: 0,
                            height: 0,
                            borderLeft: "8px solid transparent",
                            borderRight: "8px solid transparent",
                            borderTop: "8px solid #ff6b6b"
                        }}></div>
                    </div>
                )}
                
                <button
                    onClick={() => setShowGoalOverlay(true)}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = "scale(1.1)";
                        e.currentTarget.style.boxShadow = "0 12px 35px rgba(34, 158, 188, 0.6)";
                        e.currentTarget.style.animation = "none";
                        setShowTooltip(true);
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 8px 25px rgba(34, 158, 188, 0.4)";
                        e.currentTarget.style.animation = "goalPulse 2s infinite";
                        setShowTooltip(false);
                    }}
                    style={{
                        padding: "1rem",
                        background: "linear-gradient(135deg, #229EBC, #007bff)",
                        color: "#fff",
                        borderRadius: "50%",
                        border: "3px solid rgba(255,255,255,0.3)",
                        fontSize: "1.8rem",
                        cursor: "pointer",
                        boxShadow: "0 8px 25px rgba(34, 158, 188, 0.4)",
                        width: "70px",
                        height: "70px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.3s ease",
                        fontFamily: "'Comic Sans MS', cursive, sans-serif",
                        animation: "goalPulse 2s infinite"
                    }}
                    title="Set your learning goals!"
                    aria-label="Open Goal Setting Modal"
                >
                    🎯
                </button>
            </div>

            {/* Add CSS for animations */}
            <style>{`
                @keyframes goalPulse {
                    0% {
                        box-shadow: 0 8px 25px rgba(34, 158, 188, 0.4), 0 0 0 0 rgba(34, 158, 188, 0.7);
                    }
                    70% {
                        box-shadow: 0 8px 25px rgba(34, 158, 188, 0.4), 0 0 0 10px rgba(34, 158, 188, 0);
                    }
                    100% {
                        box-shadow: 0 8px 25px rgba(34, 158, 188, 0.4), 0 0 0 0 rgba(34, 158, 188, 0);
                    }
                }
                
                @keyframes tooltipBounce {
                    0% {
                        transform: scale(0.8) translateY(10px);
                        opacity: 0;
                    }
                    50% {
                        transform: scale(1.05) translateY(-5px);
                        opacity: 0.8;
                    }
                    100% {
                        transform: scale(1) translateY(0px);
                        opacity: 1;
                    }
                }
            `}</style>

            {/* Goal Overlay */}
            {showGoalOverlay && <GoalOverlay onClose={() => setShowGoalOverlay(false)} />}

            {/* Study Login Modal */}
            {showStudyLogin && (
                <div style={{
                    position: "fixed",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: "rgba(0,0,0,0.6)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    zIndex: 1001
                }}>
                    <div style={{
                        backgroundColor: "white",
                        padding: "2.5rem",
                        borderRadius: "12px",
                        maxWidth: "480px",
                        width: "90%",
                        boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                        border: "3px solid #007bff"
                    }}>
                        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🔬</div>
                            <h2 style={{ color: "#007bff", margin: 0, fontSize: "1.5rem" }}>
                                Research Study Login
                            </h2>
                            <p style={{ color: "#666", marginTop: "0.5rem", fontSize: "1rem" }}>
                                Join our research study to contribute valuable data while training
                            </p>
                        </div>
                        
                        {loginError && (
                            <div style={{
                                backgroundColor: "#f8d7da",
                                color: "#721c24",
                                padding: "0.75rem",
                                borderRadius: "6px",
                                marginBottom: "1.5rem",
                                border: "1px solid #f5c6cb",
                                fontSize: "0.9rem"
                            }}>
                                ⚠️ {loginError}
                            </div>
                        )}
                        
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target as HTMLFormElement);
                            const participantId = formData.get('participantId') as string;
                            handleStudyLogin(participantId);
                        }}>
                            <div style={{ marginBottom: "1.5rem" }}>
                                <label style={{
                                    display: "block",
                                    marginBottom: "0.5rem",
                                    fontWeight: "600",
                                    color: "#333",
                                    fontSize: "1rem"
                                }}>
                                    Participant ID:
                                </label>
                                <input
                                    type="text"
                                    name="participantId"
                                    placeholder="Enter your participant ID (e.g., PART001)"
                                    required
                                    style={{
                                        width: "100%",
                                        padding: "1rem",
                                        fontSize: "1rem",
                                        border: "2px solid #ddd",
                                        borderRadius: "8px",
                                        boxSizing: "border-box",
                                        transition: "border-color 0.2s ease"
                                    }}
                                    onFocus={(e) => {
                                        e.target.style.borderColor = "#007bff";
                                        setLoginError("");
                                    }}
                                    onBlur={(e) => {
                                        e.target.style.borderColor = "#ddd";
                                    }}
                                />
                                <small style={{ color: "#666", fontSize: "0.85rem" }}>
                                    3-20 characters: letters, numbers, underscore, hyphen only
                                </small>
                            </div>
                            
                            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
                                <button type="submit" style={{
                                    flex: 1,
                                    padding: "1rem",
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    backgroundColor: "#28a745",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#218838";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#28a745";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}>
                                    🚀 Start Study Session
                                </button>
                                
                                <button type="button" onClick={() => {
                                    setShowStudyLogin(false);
                                    setLoginError("");
                                }} style={{
                                    flex: 1,
                                    padding: "1rem",
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    backgroundColor: "#6c757d",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "8px",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease"
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.backgroundColor = "#5a6268";
                                    e.currentTarget.style.transform = "translateY(-2px)";
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.backgroundColor = "#6c757d";
                                    e.currentTarget.style.transform = "translateY(0)";
                                }}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                        
                        <div style={{
                            marginTop: "1.5rem",
                            padding: "1rem",
                            backgroundColor: "#e7f3ff",
                            borderRadius: "6px",
                            fontSize: "0.85rem",
                            color: "#0c5460"
                        }}>
                            <strong>📋 What happens when you join:</strong>
                            <ul style={{ margin: "0.5rem 0 0 0", paddingLeft: "1.2rem" }}>
                                <li>Your goals and progress will be tracked individually</li>
                                <li>All your data helps improve learning experiences</li>
                                <li>You can end your session anytime</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

function ExerciseList({ completedExercises }: { completedExercises?: (number | string)[] }): ReactElement {
    const { t } = useTranslation([TranslationNamespaces.General, TranslationNamespaces.Error, TranslationNamespaces.Flexibility]);
    const navigate = useNavigate();

    const [{ data, loading, error }] = useAxios(`/flexibility-training/getFlexibilityExercises`);

    if (loading) return <Loader />;
    if (error) {
        console.error(error);
        return <p className={"exercise-list__load-error"}>{t(ErrorTranslations.ERROR_LOAD, { ns: TranslationNamespaces.Error })}</p>;
    }

    const exerciseList: FlexibilityExerciseResponse[] = data as FlexibilityExerciseResponse[];
    
    const fullExerciseList = [...exerciseList];
    const exerciseIds: number[] = fullExerciseList.map((entry: FlexibilityExerciseResponse) => entry.id);
    const completedCount = completedExercises ? completedExercises.length : 0;

    // Display progressive stats when exercises are loaded
    const studySession = getStudySession();
    const userId = studySession?.userId || 1;
    console.log(`🎯 Displaying Progressive Stats on FlexibilityView load:`);
    displayProgressiveStats(userId);

    // Example: Show alert when 3 exercises are completed
    // if (completedCount == 3) {
    //     alert("Congratulations! You have completed 3 exercises!");
    // }

    const getDifficultyLevel = (exerciseType: any) => {
        switch (exerciseType) {
            case FlexibilityExerciseType.Suitability:     // 2
                return "Easy";
            case FlexibilityExerciseType.Efficiency:      // 1
                return "Medium";
            case FlexibilityExerciseType.Matching:        // 3
                return "Hard";
            case FlexibilityExerciseType.TipExercise:     // 4
                return "Medium";
            case FlexibilityExerciseType.PlainExercise:   // 5
                return "Easy";
            default:
                return "Medium";
        }
    };

    const getDifficultyColor = (exerciseType: any) => {
        switch (exerciseType) {
            case FlexibilityExerciseType.Suitability:     // 2
                return { color: "green" };
            case FlexibilityExerciseType.Efficiency:      // 1
                return { color: "orange" };
            case FlexibilityExerciseType.Matching:        // 3
                return { color: "red" };
            case FlexibilityExerciseType.TipExercise:     // 4
                return { color: "orange" };
            case FlexibilityExerciseType.PlainExercise:   // 5
                return { color: "green" };
            default:
                return { color: "orange" };
        }
    };

    const getExerciseName = (exerciseType: any) => {
        return t(FlexibilityExerciseType[exerciseType], { ns: TranslationNamespaces.Flexibility });
    };
    return (
        <div className={"exercise-list"}>
            {fullExerciseList.map((entry: FlexibilityExerciseResponse, index) => {
                const handleExerciseClick = async (entry: FlexibilityExerciseResponse) => {
                    // Log exercise selection
                    const exerciseName = getExerciseName(entry.exerciseType);
                    const difficulty = getDifficultyLevel(entry.exerciseType);
                    
                    // Use dynamic userId - check for study session or default to public
                    const studySession = getStudySession();
                    const userId = studySession?.userId || 1;
                    
                    console.log(`📊 Logging exercise selection for userId: ${userId}`);
                    console.log(`🎯 Progressive Stats before starting exercise:`);
                    displayProgressiveStats(userId);
                    
                    try {
                        await logAction(
                            userId,
                            "ExerciseSelected",
                            `Selected exercise: ${exerciseName} (Difficulty: ${difficulty})`
                        );
                    } catch (error) {
                        console.error("Failed to log exercise selection:", error);
                    }
                    
                    // Normal API-driven exercise navigation
                    navigate(Paths.FlexibilityPath + Paths.ExercisesSubPath + entry.id, {
                        state: { exerciseType: entry.exerciseType, exerciseId: entry.exerciseId, exercises: exerciseIds }
                    });
                };

                const isCompleted: boolean = isExerciseCompleted(entry.id, completedExercises);
                    
                return (
                    <div
                        key={index}
                        className={"exercise-list__item" + (isCompleted ? "--completed" : "--todo")}
                        onClick={() => handleExerciseClick(entry)}
                    >
                        <p className={"exercise-font"}>
                            {t(GeneralTranslations.NAV_EXERCISE)} {index + 1}
                        </p>
                        <p>{getExerciseName(entry.exerciseType)}</p>
                        <p style={getDifficultyColor(entry.exerciseType)} className={"exercise-font"}>
                            Difficulty: {getDifficultyLevel(entry.exerciseType)}
                        </p>
                        <p className={"exercise-list__status"}>{isCompleted ? t(GeneralTranslations.COMPLETED) : "To-Do"}</p>
                        <FontAwesomeIcon className={"exercise-font"} icon={faChevronRight} />
                    </div>
                );
            })}
        </div>
    );
}