import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React, { ReactElement, useCallback, useEffect, useRef, useState } from "react";
import { AgentExpression, AgentType } from "@/types/flexibility/enums.ts";
import { Agent } from "@components/flexibility/interventions/Agent.tsx";
import useWindowDimensions from "@hooks/useWindowDimensions.ts";
import { getFlexibilityFeedbackOrHintWidth } from "@utils/utils.ts";

export function FlexibilityPopover({ children, agentType, agentExpression }: { children: ReactElement; agentType?: AgentType; agentExpression?: AgentExpression }): ReactElement {
    const useAgent = agentType !== undefined && agentExpression !== undefined;
    const { windowWidth } = useWindowDimensions();
    const width = getFlexibilityFeedbackOrHintWidth(windowWidth, useAgent);
    
    // State to hide popover when exercise ends or goal completion starts
    const [isHidden, setIsHidden] = useState(false);

    // Listen for exercise end and goal completion events
    useEffect(() => {
        const handleHidePopover = () => {
            console.log('🎯 FlexibilityPopover: Hiding continue button agent - exercise/goal completion triggered');
            setIsHidden(true);
        };

        // Hide when goal completion flow starts
        window.addEventListener('triggerGoalCompletion', handleHidePopover);
        
        // Hide when goal feedback is complete (retrospective opening)
        window.addEventListener('goalFeedbackComplete', handleHidePopover);

        return () => {
            window.removeEventListener('triggerGoalCompletion', handleHidePopover);
            window.removeEventListener('goalFeedbackComplete', handleHidePopover);
        };
    }, []);

    // Don't render if hidden
    if (isHidden) {
        return <React.Fragment />;
    }

    return (
        <React.Fragment>
            {useAgent && <Agent type={agentType} expression={agentExpression} />}
            <div className={`flexibility-popover ${useAgent ? "agent-popover" : ""}`} style={{ maxWidth: `${width}px` }}>
                <div className={`flexibility-popover__container ${useAgent ? "agent-popover__container" : ""}`}>{children}</div>
            </div>
        </React.Fragment>
    );
}

export function ClosableFlexibilityPopover({ children, setShowContent, agentType, agentExpression }: { children: ReactElement; setShowContent: (value: React.SetStateAction<boolean>) => void; agentType?: AgentType; agentExpression?: AgentExpression }): ReactElement {
    const useAgent = agentType !== undefined && agentExpression !== undefined;
    const { windowWidth } = useWindowDimensions();
    const width = getFlexibilityFeedbackOrHintWidth(windowWidth, useAgent);

    const contentRef = useRef<HTMLDivElement>(null);
    
    // State to hide popover when exercise ends or goal completion starts
    const [isHidden, setIsHidden] = useState(false);

    const handleClickOutside = useCallback(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (event: any): void => {
            if (contentRef.current && !contentRef.current.contains(event.target)) {
                setShowContent(false);
            }
        },
        [setShowContent]
    );

    useEffect(() => {
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [handleClickOutside]);

    // Listen for exercise end and goal completion events
    useEffect(() => {
        const handleHidePopover = () => {
            console.log('🎯 ClosableFlexibilityPopover: Hiding continue button agent - exercise/goal completion triggered');
            setIsHidden(true);
            setShowContent(false);
        };

        // Hide when goal completion flow starts
        window.addEventListener('triggerGoalCompletion', handleHidePopover);
        
        // Hide when goal feedback is complete (retrospective opening)
        window.addEventListener('goalFeedbackComplete', handleHidePopover);

        return () => {
            window.removeEventListener('triggerGoalCompletion', handleHidePopover);
            window.removeEventListener('goalFeedbackComplete', handleHidePopover);
        };
    }, [setShowContent]);

    // Don't render if hidden
    if (isHidden) {
        return <React.Fragment />;
    }

    return (
        <React.Fragment>
            {useAgent && <Agent type={agentType} expression={agentExpression} />}
            <div className={`flexibility-popover ${useAgent ? "agent-popover" : ""}`} style={{ maxWidth: `${width}px` }} ref={contentRef}>
                <button className={"span-button primary-button hint-popover__button"} onClick={() => setShowContent(false)}>
                    <FontAwesomeIcon icon={faXmark} />
                </button>
                <div className={`flexibility-popover__container ${useAgent ? "agent-popover__container" : ""}`}>{children}</div>
            </div>
        </React.Fragment>
    );
}
