import { ExerciseCompletionDto, ExerciseStatusDto, ExerciseCompletionResultDto, CustomExerciseData } from '../types/customExercise';

const API_BASE_URL = 'http://localhost:7273/api';

export const customExerciseAPI = {
  // Complete an exercise
  completeExercise: async (data: ExerciseCompletionDto): Promise<ExerciseCompletionResultDto> => {
    const response = await fetch(`${API_BASE_URL}/custom-exercises/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`Failed to complete exercise: ${response.statusText}`);
    }

    return response.json();
  },

  // Get exercise status for a user
  getExerciseStatus: async (userId: number, exerciseId: number): Promise<ExerciseStatusDto> => {
    const response = await fetch(`${API_BASE_URL}/custom-exercises/status/${userId}/${exerciseId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get exercise status: ${response.statusText}`);
    }

    return response.json();
  },

  // Get all exercise data for a user
  getUserExerciseData: async (userId: number): Promise<CustomExerciseData[]> => {
    const response = await fetch(`${API_BASE_URL}/custom-exercises/user/${userId}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to get user exercise data: ${response.statusText}`);
    }

    return response.json();
  },
};
