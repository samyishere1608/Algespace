/**
 * Goal Setting Translation Utilities
 * Maps goal titles to translation keys and provides helper functions
 */

// Map English goal titles to translation keys
export const goalTitleToKey: Record<string, string> = {
  "Learn what linear equations are": "learn-linear-equations",
  "Understand how substitution works": "understand-substitution",
  "Understand how elimination works": "understand-elimination",
  "Understand how equalization works": "understand-equalization",
  "Master substitution/equalization/elimination method": "master-single-method",
  "Practice with different methods": "practice-different-methods",
  "Switch methods strategically": "switch-methods-strategically",
  "Choose optimal methods consistently": "choose-optimal-methods",
  "Master all three methods fluently": "master-all-methods",
  "Complete exercises without hints": "complete-without-hints",
  "Solve problems with minimal errors": "solve-minimal-errors",
  "Handle complex problems confidently": "handle-complex-problems",
  "Show exceptional problem-solving": "exceptional-problem-solving",
  "Maintain accuracy under pressure": "maintain-accuracy",
  "Reflect on method effectiveness": "reflect-effectiveness",
  "Build confidence through success": "build-confidence",
  "Learn from mistakes effectively": "learn-from-mistakes",
  "Develop problem-solving resilience": "develop-resilience",
  "Explain reasoning clearly": "explain-reasoning",
  "Show consistent improvement": "show-improvement",
  "Work independently": "work-independently",
  "Set personal learning challenges": "set-learning-challenges"
};

// Reverse mapping: translation key to English title (for backend compatibility)
export const keyToGoalTitle: Record<string, string> = Object.fromEntries(
  Object.entries(goalTitleToKey).map(([title, key]) => [key, title])
);

// Category name to translation key
export const categoryToKey: Record<string, string> = {
  "Basic Understanding": "basic-understanding",
  "Method Mastery": "method-mastery",
  "Problem Solving": "problem-solving",
  "Learning & Growth": "learning-growth"
};

// Difficulty level to translation key
export const difficultyToKey: Record<string, string> = {
  "very easy": "very-easy",
  "easy": "easy",
  "medium": "medium",
  "hard": "hard",
  "very hard": "very-hard"
};

/**
 * Get translation key for goal title
 */
export function getGoalTitleKey(title: string): string {
  return goalTitleToKey[title] || title;
}

/**
 * Get translation key for goal description
 */
export function getGoalDescriptionKey(title: string): string {
  const key = goalTitleToKey[title];
  return key || title;
}

/**
 * Get translation key for category
 */
export function getCategoryKey(category: string): string {
  return categoryToKey[category] || category;
}

/**
 * Get translation key for difficulty
 */
export function getDifficultyKey(difficulty: string): string {
  return difficultyToKey[difficulty.toLowerCase()] || difficulty.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get English title from translation key (for API calls)
 */
export function getEnglishTitle(key: string): string {
  return keyToGoalTitle[key] || key;
}

/**
 * Categorized goals structure with translation keys
 */
export const categorizedGoalsKeys = {
  "basic-understanding": [
    { key: "learn-linear-equations", difficulty: "very-easy" },
    { key: "understand-substitution", difficulty: "very-easy" },
    { key: "understand-elimination", difficulty: "very-easy" },
    { key: "understand-equalization", difficulty: "very-easy" }
  ],
  "method-mastery": [
    { key: "master-single-method", difficulty: "easy" },
    { key: "practice-different-methods", difficulty: "easy" },
    { key: "switch-methods-strategically", difficulty: "medium" },
    { key: "choose-optimal-methods", difficulty: "hard" },
    { key: "master-all-methods", difficulty: "very-hard" }
  ],
  "problem-solving": [
    { key: "complete-without-hints", difficulty: "easy" },
    { key: "solve-minimal-errors", difficulty: "medium" },
    { key: "handle-complex-problems", difficulty: "medium" },
    { key: "exceptional-problem-solving", difficulty: "hard" },
    { key: "maintain-accuracy", difficulty: "very-hard" }
  ],
  "learning-growth": [
    { key: "reflect-effectiveness", difficulty: "very-easy" },
    { key: "build-confidence", difficulty: "easy" },
    { key: "learn-from-mistakes", difficulty: "easy" },
    { key: "develop-resilience", difficulty: "medium" },
    { key: "explain-reasoning", difficulty: "medium" },
    { key: "show-improvement", difficulty: "hard" },
    { key: "set-learning-challenges", difficulty: "hard" },
    { key: "work-independently", difficulty: "very-hard" }
  ]
};
