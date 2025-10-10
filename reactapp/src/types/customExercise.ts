// Custom Exercise API Types
export interface ExerciseCompletionDto {
  userId: number;
  exerciseId: number;
  exerciseName: string;
  exerciseType: string;
  completionData?: Record<string, any>;
}

export interface ExerciseStatusDto {
  hasCompleted: boolean;
  completedAt?: string;
  completionData?: Record<string, any>;
}

export interface ExerciseCompletionResultDto {
  success: boolean;
  message: string;
}

export interface CustomExerciseData {
  id: number;
  userId: number;
  exerciseId: number;
  exerciseName: string;
  exerciseType: string;
  completedAt: string;
  completionData?: string;
}
