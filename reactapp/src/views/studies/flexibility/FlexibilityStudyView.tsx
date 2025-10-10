import React, { ReactElement, useState} from "react";
import { useAuth } from "@/contexts/AuthProvider.tsx";
import { useNavigate, useParams} from "react-router-dom";
import ErrorScreen from "@components/shared/ErrorScreen.tsx";
import { ErrorTranslations } from "@/types/shared/errorTranslations.ts";
import { Paths } from "@routes/paths.ts";
import GoalOverlay from "@/components/Goaloverlay";
import {
    getCompletedFlexibilityStudyDemos,
    getCompletedFlexibilityStudyExercises,
    setFlexibilityStudyStudyCompleted
} from "@utils/storageUtils.ts";
import ViewLayout from "@components/views/ViewLayout.tsx";
import { StudyTranslations } from "@/types/studies/studyTranslations.ts";
import { useTranslation } from "react-i18next";
import { TranslationNamespaces } from "@/i18n.ts";
import { CompletedDemo } from "@/types/flexibility/enums.ts";
import { useErrorBoundary } from "react-error-boundary";
import useAxios from "axios-hooks";
import Loader from "@components/shared/Loader.tsx";
import { FlexibilityExerciseResponse } from "@/types/flexibility/flexibilityExerciseResponse.ts";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowRight } from "@fortawesome/free-solid-svg-icons";
import "@styles/flexibility/flexibility.scss";

export function FlexibilityStudyView(): ReactElement {
    const { t } = useTranslation(TranslationNamespaces.Study);
    const navigate = useNavigate();
    const { logout } = useAuth();
    const { studyId } = useParams();
    const [showGoalOverlay, setShowGoalOverlay] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);




    if (studyId === undefined || studyId === "undefined") {
        logout();
        return <ErrorScreen text={ErrorTranslations.ERROR_STUDY_ID} routeToReturn={Paths.StudiesLoginPath} showFrownIcon={true} />;
    }

    const completedDemos = getCompletedFlexibilityStudyDemos(studyId);
    const finishedEqualization = completedDemos?.includes(CompletedDemo.Equalization) ?? false;
    const finishedSubstitution = completedDemos?.includes(CompletedDemo.Substitution) ?? false;
    const finishedElimination = completedDemos?.includes(CompletedDemo.Elimination) ?? false;

    return (
        <>
            <ViewLayout title={t(StudyTranslations.STUDY)} isStudy={true}>
                <div className={"flexibility-view__contents flexibility-study-view"}>
                    <p>{t(StudyTranslations.FLEXIBILITY_STUDY_2)} <strong>{t(StudyTranslations.FLEXIBILITY_STUDY_3)}</strong></p>
                    <div className={"demo-buttons"}>
                        <button className={`button ${finishedEqualization ? "green-button" : "primary-button"}`}
                                onClick={() => navigate(Paths.FlexibilityStudyPath + `${studyId}/` + "equalization-demo")}>
                            {t(StudyTranslations.TRY_EQUALIZATION)}
                            <FontAwesomeIcon icon={faArrowRight} />
                        </button>
                        <button className={`button ${finishedSubstitution ? "green-button" : "primary-button"}`}
                                onClick={() => navigate(Paths.FlexibilityStudyPath + `${studyId}/` + "substitution-demo")}>
                            {t(StudyTranslations.TRY_SUBSTITUTION)}
                            <FontAwesomeIcon icon={faArrowRight} />
                        </button>
                        <button className={`button ${finishedElimination ? "green-button" : "primary-button"}`}
                                onClick={() => navigate(Paths.FlexibilityStudyPath + `${studyId}/` + "elimination-demo")}>
                            {t(StudyTranslations.TRY_ELIMINATION)}
                            <FontAwesomeIcon icon={faArrowRight} />
                        </button>
                    </div>
                    {(finishedEqualization && finishedSubstitution && finishedElimination) && <FlexibilityStudy studyId={studyId.replace(/\D/g, "")} />}
                </div>
            </ViewLayout>

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
                        e.currentTarget.style.boxShadow = "0 8px 20px rgba(0, 123, 255, 0.6)";
                        setShowTooltip(true);
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = "scale(1)";
                        e.currentTarget.style.boxShadow = "0 4px 8px rgba(0,0,0,0.3)";
                        setShowTooltip(false);
                    }}
                    style={{
                        padding: "1rem 1.2rem",
                        background: "linear-gradient(135deg, #007bff, #0056b3)",
                        color: "#fff",
                        borderRadius: "50%",
                        border: "none",
                        fontSize: "1.2rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                        transition: "all 0.3s ease",
                        fontFamily: "'Comic Sans MS', cursive, sans-serif"
                    }}
                    title="Set your learning goals!"
                >
                    🎯
                </button>
            </div>

            {/* Add CSS for animations */}
            <style>{`
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
        </>
    );
}

function FlexibilityStudy({ studyId }: { studyId: string }): ReactElement {
    const {t} = useTranslation(TranslationNamespaces.Study);
    const {showBoundary} = useErrorBoundary();
    console.log(studyId)
    const { user, logout } = useAuth();

    const navigate = useNavigate();

    const [{data, loading, error}] = useAxios({
        url: `/flexibility-study/getExercisesForStudy/${studyId}`,
        headers: {
            Authorization: "Bearer " + user?.token
        }
    });

    if (loading) return <Loader/>;
    if (error) {
        console.error(error);
        if (error.response?.status === 401) {
            logout();
            navigate(Paths.StudiesLoginPath);
        }
        showBoundary(error);
    }

    const exerciseList: FlexibilityExerciseResponse[] = data as FlexibilityExerciseResponse[];
    let index = 0;
    const completedExercises: (string | number)[] | undefined = getCompletedFlexibilityStudyExercises(studyId);
    if (completedExercises !== undefined && completedExercises.length !== 0) {
        index = Math.max(...completedExercises.map(exercise => exercise as number));
    }

    return <React.Fragment>
        <p>{t(StudyTranslations.FLEXIBILITY_STUDY_4)}</p>
        <p>{t(StudyTranslations.FLEXIBILITY_STUDY_5)}</p>
        <p><strong>{t(StudyTranslations.FLEXIBILITY_STUDY_6)}</strong> {t(StudyTranslations.FLEXIBILITY_STUDY_7)}</p>
        <button className={"button primary-button"}
                onClick={() => {
                    const firstHalf = exerciseList.slice(0, Math.floor(exerciseList.length / 2));
                    if (index  < firstHalf.length - 1){
                        navigate(Paths.FlexibilityStudyPath + `${studyId}/` + Paths.ExercisesSubPath + exerciseList[index].id, {
                            state: {exercises: firstHalf, condition: user?.agentCondition}
                        });
                    } else {
                        setFlexibilityStudyStudyCompleted(studyId, "1");
                        navigate(Paths.FlexibilityStudyEndPath);
                    }
                }}
        >
            {t(StudyTranslations.START_STUDY1)}
            <FontAwesomeIcon icon={faArrowRight}/>
        </button>

        <button className={"button primary-button"}
                onClick={() => {
                    const secondHalf = exerciseList.slice(Math.floor(exerciseList.length / 2));
                    if (index < exerciseList.length - 1) {
                        const firstHalf = exerciseList.slice(0, Math.floor(exerciseList.length / 2));
                        index = firstHalf.length;
                        navigate(Paths.FlexibilityStudyPath + `${studyId}/` + Paths.ExercisesSubPath + exerciseList[index].id, {
                            state: {exercises: secondHalf, condition: user?.agentCondition}
                        });
                    } else {
                        setFlexibilityStudyStudyCompleted(studyId, "2");
                        navigate(Paths.FlexibilityStudyEndPath);
                    }
                }}
        >
            {t(StudyTranslations.START_STUDY2)}
            <FontAwesomeIcon icon={faArrowRight}/>
        </button>
    </React.Fragment>;
}