// src/utils/api.ts

import { Goal, GoalInput } from "../types/goal";
import { PretestAnswers, PretestStatus, PretestResult } from "../types/pretest";

const API_BASE_URL = `${import.meta.env.VITE_API_URL || "http://localhost:7273"}/api`;

// Debug function to test study session userId
export async function testStudySessionUserId(): Promise<void> {
  console.log('🔍 Testing study session userId...');
  
  // First, let's clear any existing study session and create a new one with smaller userIds
  console.log('🔍 Clearing existing study session for fresh test...');
  localStorage.removeItem('flexibilityStudySession');
  localStorage.removeItem('flexibilityStudyRegistry');
  
  // Test localStorage directly
  const rawSession = localStorage.getItem('flexibilityStudySession');
  console.log('🔍 Raw session from localStorage (should be null):', rawSession);
  
  // First test with a known working userId (like 1)
  console.log('🔍 Testing fetchGoals with userId 1 (control test)...');
  try {
    const goalsForUser1 = await fetchGoals(1);
    console.log('🔍 fetchGoals for userId=1 SUCCESS:', goalsForUser1);
  } catch (error) {
    console.error('🔍 fetchGoals for userId=1 FAILED:', error);
  }
  
  // Test with a study-range userId
  const testStudyUserId = 10001;
  console.log('🔍 Testing fetchGoals with test study userId:', testStudyUserId);
  try {
    const goalsForStudyUser = await fetchGoals(testStudyUserId);
    console.log('🔍 fetchGoals for study userId SUCCESS:', goalsForStudyUser);
  } catch (error) {
    console.error('🔍 fetchGoals for study userId FAILED:', error);
  }
}

// Add this to window for easy testing
if (typeof window !== 'undefined') {
  (window as any).testStudySessionUserId = testStudySessionUserId;
}

export async function fetchGoals(userId: number): Promise<Goal[]> {
  const res = await fetch(`${API_BASE_URL}/goals/user/${userId}`);
  if (!res.ok) throw new Error("Failed to fetch goals");
  return res.json();
}

export async function createGoal(goal: GoalInput): Promise<Goal> {
  console.log('🎯 createGoal called with:', goal);
  console.log('🎯 goal.userId:', goal.userId, 'type:', typeof goal.userId);
  
  // Convert to backend format (PascalCase) to match GoalCreateDto
  const backendGoal = {
    UserId: Number(goal.userId), // Ensure it's a number
    Title: goal.title,
    Difficulty: goal.difficulty,
    Category: goal.category,
    ConfidenceBefore: goal.confidenceBefore,
    ExpectedMistakes: goal.expectedMistakes,
    MotivationRating: goal.MotivationRating
  };
  
  console.log('🎯 Sending to backend:', backendGoal);
  console.log('🎯 Backend UserId:', backendGoal.UserId, 'type:', typeof backendGoal.UserId);
  
  const res = await fetch(`${API_BASE_URL}/goals`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(backendGoal),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('🎯 Goal creation failed:', res.status, res.statusText, errorText);
    throw new Error("Failed to create goal");
  }
  return res.json();
}


export async function updateGoal(id: number, goal: GoalInput): Promise<Goal> {
  const res = await fetch(`${API_BASE_URL}/goals/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(goal),
  });
  if (!res.ok) throw new Error("Failed to update goal");
  return res.json();
}

// New: Delete goal by id
export async function deleteGoal(id: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/goals/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete goal");
}
export async function markGoalAsDone(
  id: number,
  postSatisfaction: number,
  postDifficulty: number,
  postConfidence: number
): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/goals/${id}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
   // You can make this dynamic later
      postSatisfaction,
      postDifficulty,
      postConfidence
    })
  });

  if (!res.ok) {
    throw new Error("Failed to mark goal as done");
  }
  return res.json();
}

export async function submitMotivationRating(id: number, rating: number): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/goals/${id}/motivation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ rating }),  // ✅ wrap it in an object
  });
  if (!res.ok) throw new Error("Failed to submit motivation rating");
}

export async function logReason(goalId: number, action: string, reason: string) {
  const res = await fetch(`${API_BASE_URL}/goals/${goalId}/log-reason`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, reason }),
  });

  if (!res.ok) throw new Error("Failed to log reason");
}

export async function logEmotion(goalId: number, context: string, emotion: string) {
  const res = await fetch(`${API_BASE_URL}/goals/${goalId}/log-emotion`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ context, emotion }),
  });
  if (!res.ok) throw new Error("Failed to log emotion");
}

export async function fetchGoalHistory(userId: number) {
  const res = await fetch(`${API_BASE_URL}/goals/user/${userId}/history`);
  if (!res.ok) throw new Error("Failed to fetch goal history");
  return res.json();
}

export async function completeGoalWithScore(
  id: number, 
  actualScore?: number,
  hintsUsed?: number,
  errorsMade?: number,
  postSatisfaction?: number,
  postConfidence?: number,
  postEffort?: number,
  postEnjoyment?: number,
  postAnxiety?: number
): Promise<Goal> {
  const res = await fetch(`${API_BASE_URL}/goals/${id}/complete`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      actualScore,
      hintsUsed,
      errorsMade,
      postSatisfaction,
      postConfidence,
      postEffort,
      postEnjoyment,
      postAnxiety
    }),
  });
  
  if (!res.ok) throw new Error("Failed to complete goal with score");
  return res.json();
}

// Remove or deprecate the old markGoalAsDone function since we're using completeGoalWithScore

export async function logFeedbackShown(goalId: number, type: string, message: string) {
  const res = await fetch(`${API_BASE_URL}/goals/${goalId}/feedback-shown`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type, message }),
  });
  if (!res.ok) throw new Error("Failed to log feedback shown");
}

// Pretest API functions
export async function checkPretestStatus(userId: number): Promise<PretestStatus> {
  const res = await fetch(`${API_BASE_URL}/pretest/status/${userId}`);
  if (!res.ok) throw new Error("Failed to check pretest status");
  return res.json();
}

export async function submitPretestAnswers(userId: number, answers: PretestAnswers): Promise<PretestResult> {
  console.log('🎯 submitPretestAnswers called with userId:', userId, 'type:', typeof userId);
  console.log('🎯 Answers:', answers);
  
  const requestBody = { 
    UserId: Number(userId), // Ensure it's a number
    Answers: answers 
  };
  
  console.log('🎯 Sending pretest request:', requestBody);
  console.log('🎯 Request UserId:', requestBody.UserId, 'type:', typeof requestBody.UserId);
  
  const res = await fetch(`${API_BASE_URL}/pretest/save`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });
  
  if (!res.ok) {
    const errorText = await res.text();
    console.error('🎯 Pretest submission failed:', res.status, res.statusText, errorText);
    throw new Error("Failed to submit pretest answers");
  }
  return res.json();
}

// Logging API function
// Test function for backend study login
export const testBackendStudyLogin = async (participantId: string): Promise<{userId: number, participantId: string}> => {
    try {
        const response = await fetch(`${API_BASE_URL}/goals/study/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ participantId })
        });

        if (!response.ok) {
            throw new Error(`Backend study login failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        console.log(`✅ Backend study login successful:`, data);
        return data;
    } catch (error) {
        console.error('❌ Backend study login failed:', error);
        throw error;
    }
};

export const logAction = async (userId: number, actionType: string, description: string) => {
  const res = await fetch(`${API_BASE_URL}/goals/log`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ 
      UserId: userId, 
      ActionType: actionType, 
      Description: description 
    }),
  });
  if (!res.ok) throw new Error("Failed to log action");
}

// Update dynamic goal suggestions based on user progress
export async function updateGoalSuggestions(userId: number): Promise<string[]> {
  const res = await fetch(`${API_BASE_URL}/goals/update-suggestions/${userId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to update goal suggestions");
  const result = await res.json();
  return result.updatedSuggestions || [];
}

// Get performance statistics for tracking
export async function getUserPerformanceStats(userId: number): Promise<{
  stats: {
    totalGoalsCompleted: number;
    averageActualScore: number;
    averageConfidence: number;
    averageSatisfaction: number;
    averageEffort: number;
    averageHintsPerGoal: number;
    averageErrorsPerGoal: number;
  };
}> {
  const res = await fetch(`${API_BASE_URL}/goals/performance-stats/${userId}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });
  if (!res.ok) throw new Error("Failed to get performance stats");
  const result = await res.json();
  return { stats: result.Stats || result.stats };
}

// Get detailed recommendation reasons for suggested goals
export async function getRecommendationReasons(
  userId: number, 
  recommendedGoals: string[]
): Promise<Record<string, string>> {
  console.log(`� Calling recommendation reasons API for userId: ${userId}`);
  console.log(`� Recommended goals:`, recommendedGoals);
  
  try {
    const res = await fetch(`${API_BASE_URL}/goals/recommendation-reasons/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(recommendedGoals),
    });
    
    console.log(`� API Response status: ${res.status} ${res.statusText}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error(`� API Error response: ${errorText}`);
      throw new Error(`Failed to get recommendation reasons: ${res.status}`);
    }
    
    const result = await res.json();
    console.log(`� API Response data:`, result);
    
    return result.Reasons || result.reasons || {};
  } catch (error) {
    console.error(`� Recommendation reasons API call failed:`, error);
    return {}; // Return empty object on failure
  }
}