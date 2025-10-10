import { useState, useEffect } from 'react';
import { customExerciseAPI } from '@/utils/customExerciseAPI';
import { ExerciseStatusDto } from '@/types/customExercise';

interface UseCustomExerciseOptions {
  userId: number;
  exerciseId: number;
  exerciseName: string;
  exerciseType: string;
}

export const useCustomExercise = ({ userId, exerciseId, exerciseName, exerciseType }: UseCustomExerciseOptions) => {
  const [hasCompleted, setHasCompleted] = useState(false);
  const [completionData, setCompletionData] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check completion status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        setLoading(true);
        const status: ExerciseStatusDto = await customExerciseAPI.getExerciseStatus(userId, exerciseId);
        setHasCompleted(status.hasCompleted);
        setCompletionData(status.completionData || null);
        setError(null);
      } catch (err) {
        console.error('Failed to check exercise status:', err);
        setError(err instanceof Error ? err.message : 'Failed to check exercise status');
        setHasCompleted(false);
        setCompletionData(null);
      } finally {
        setLoading(false);
      }
    };

    checkStatus();
  }, [userId, exerciseId]);

  // Complete exercise with optional data
  const completeExercise = async (data?: Record<string, any>) => {
    try {
      setError(null);
      
      const result = await customExerciseAPI.completeExercise({
        userId,
        exerciseId,
        exerciseName,
        exerciseType,
        completionData: data
      });

      if (result.success) {
        setHasCompleted(true);
        setCompletionData(data || null);
        return true;
      } else {
        setError(result.message || 'Failed to complete exercise');
        return false;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to complete exercise';
      console.error('Failed to complete exercise:', err);
      setError(errorMessage);
      return false;
    }
  };

  return {
    hasCompleted,
    completionData,
    loading,
    error,
    completeExercise,
  };
};
