// ========== GOAL AUTO-COMPLETION CHANGES - START ==========
// Context for sharing goal completion functionality across exercise components
// This allows exercises to trigger goal completion without direct access to GoalList
import { createContext, useContext, ReactNode } from 'react';

interface GoalCompletionContextType {
  completeGoalByTitle: (title: string) => void;
}

const GoalCompletionContext = createContext<GoalCompletionContextType | undefined>(undefined);

export function GoalCompletionProvider({ 
  children, 
  completeGoalByTitle 
}: { 
  children: ReactNode;
  completeGoalByTitle: (title: string) => void;
}) {
  return (
    <GoalCompletionContext.Provider value={{ completeGoalByTitle }}>
      {children}
    </GoalCompletionContext.Provider>
  );
}

export function useGoalCompletion() {
  const context = useContext(GoalCompletionContext);
  if (!context) {
    // Return a fallback implementation
    return { 
      completeGoalByTitle: (title: string) => {
        console.log(`🎯 Auto-completion triggered for "${title}" but no active goal context available`);
        // This means exercises are running without the goal overlay open
      }
    };
  }
  return context;
}
// ========== GOAL AUTO-COMPLETION CHANGES - END ==========
