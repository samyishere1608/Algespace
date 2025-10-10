// src/types/goal.ts

export interface Goal {
  id: number;
  userId: number;
  title: string;
  difficulty: string;
  createdAt: string;
  updatedAt?: string | null;
   completed: boolean;
   MotivationRating: number;
   category: string;

     confidenceBefore?: number;          // 1-5
  expectedMistakes?: number; // Number of mistakes expected (replaces expectedPerformanceBefore)
  actualScore?: number;               // 0.0 - 1.0
  goalAchieved?: boolean;
}

export interface GoalInput {
       userId: number;
  title: string;
  difficulty: string;
    category: string;
     confidenceBefore?: number | null;
  expectedMistakes?: number | null;
  MotivationRating?: number | null;

  // userId NOT included here because backend assigns it
}
