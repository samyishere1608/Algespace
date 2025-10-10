// 🧪 PROGRESSIVE GOAL TRIGGERING TEST CASES
// Tests for goal completion logic in progressiveGoalTracking.ts

console.log("🎯 ===== PROGRESSIVE GOAL TRIGGERING TEST SUITE =====");

// GOAL TRIGGERING TEST SCENARIOS

// Test Category 1: Basic Understanding Goals
const basicUnderstandingTests = [
  {
    name: "First Exercise Completion → 'Learn what linear equations are'",
    sessionData: { hints: 2, errors: 1, method: "substitution", exerciseType: "suitability", completedWithSelfExplanation: false },
    currentProgress: { total: 0, substitution: 0, elimination: 0, equalization: 0, errorHistory: [], selfExplanations: 0 },
    expectedTriggeredGoals: ["Learn what linear equations are", "Understand how substitution works"],
    explanation: "First exercise ever + first substitution use should trigger both basic goals"
  },
  {
    name: "First Elimination Use → 'Understand how elimination works'",
    sessionData: { hints: 1, errors: 2, method: "elimination", exerciseType: "efficiency", completedWithSelfExplanation: false },
    currentProgress: { total: 3, substitution: 2, elimination: 0, equalization: 0, errorHistory: [1, 2, 1], selfExplanations: 0 },
    expectedTriggeredGoals: ["Understand how elimination works"],
    explanation: "First time using elimination method"
  },
  {
    name: "First Equalization Use → 'Understand how equalization works'", 
    sessionData: { hints: 3, errors: 1, method: "equalization", exerciseType: "matching", completedWithSelfExplanation: false },
    currentProgress: { total: 5, substitution: 3, elimination: 2, equalization: 0, errorHistory: [1, 2, 1, 0, 1], selfExplanations: 1 },
    expectedTriggeredGoals: ["Understand how equalization works"],
    explanation: "First time using equalization method"
  }
];

// Test Category 2: Method Mastery Goals  
const methodMasteryTests = [
  {
    name: "Second Substitution → 'Master substitution/equalization/elimination method'",
    sessionData: { hints: 1, errors: 0, method: "substitution", exerciseType: "suitability", completedWithSelfExplanation: false },
    currentProgress: { total: 1, substitution: 1, elimination: 0, equalization: 0, errorHistory: [2], selfExplanations: 0 },
    expectedTriggeredGoals: ["Master substitution/equalization/elimination method"],
    explanation: "Reaching 2+ completions in substitution should trigger mastery goal"
  },
  {
    name: "Multiple Methods Used → 'Practice with different methods'",
    sessionData: { hints: 2, errors: 1, method: "elimination", exerciseType: "efficiency", completedWithSelfExplanation: false },
    currentProgress: { total: 3, substitution: 2, elimination: 0, equalization: 0, errorHistory: [1, 1, 2], selfExplanations: 0 },
    expectedTriggeredGoals: ["Understand how elimination works", "Practice with different methods"],
    explanation: "Using 2 different methods (substitution + elimination) should trigger variety goal"
  },
  {
    name: "All Methods Mastery → 'Master all three methods fluently'",
    sessionData: { hints: 0, errors: 1, method: "equalization", exerciseType: "matching", completedWithSelfExplanation: false },
    currentProgress: { total: 7, substitution: 3, elimination: 2, equalization: 1, errorHistory: [2, 1, 0, 1, 1, 0, 1], selfExplanations: 1 },
    expectedTriggeredGoals: ["Master all three methods fluently"],
    explanation: "Having 2+ in each method (sub=3, elim=2, equal=2) should trigger fluency goal"
  },
  {
    name: "Strategic Method Switching → 'Switch methods strategically'",
    sessionData: { hints: 1, errors: 0, method: "equalization", exerciseType: "suitability", completedWithSelfExplanation: false },
    currentProgress: { total: 2, substitution: 1, elimination: 1, equalization: 0, errorHistory: [1, 2], selfExplanations: 0 },
    expectedTriggeredGoals: ["Understand how equalization works", "Switch methods strategically"],
    explanation: "3+ total exercises with all 3 methods used should trigger strategic switching"
  }
];

// Test Category 3: Problem Solving Goals
const problemSolvingTests = [
  {
    name: "Zero Hints → 'Complete exercises without hints'", 
    sessionData: { hints: 0, errors: 2, method: "substitution", exerciseType: "efficiency", completedWithSelfExplanation: false },
    currentProgress: { total: 4, substitution: 2, elimination: 1, equalization: 1, errorHistory: [2, 1, 3, 1], selfExplanations: 0 },
    expectedTriggeredGoals: ["Complete exercises without hints"],
    explanation: "Using 0 hints should trigger independence goal"
  },
  {
    name: "Minimal Errors → 'Solve problems with minimal errors'",
    sessionData: { hints: 2, errors: 1, method: "elimination", exerciseType: "suitability", completedWithSelfExplanation: false },
    currentProgress: { total: 3, substitution: 1, elimination: 1, equalization: 1, errorHistory: [3, 2], selfExplanations: 0 },
    expectedTriggeredGoals: ["Solve problems with minimal errors"],
    explanation: "Making ≤1 error should trigger minimal errors goal"
  },
  {
    name: "Perfect Performance → 'Show exceptional problem-solving'",
    sessionData: { hints: 0, errors: 0, method: "substitution", exerciseType: "matching", completedWithSelfExplanation: false },
    currentProgress: { total: 6, substitution: 3, elimination: 2, equalization: 1, errorHistory: [2, 1, 1, 0, 2, 1], selfExplanations: 2 },
    expectedTriggeredGoals: ["Complete exercises without hints", "Solve problems with minimal errors", "Show exceptional problem-solving"],
    explanation: "0 hints AND 0 errors should trigger exceptional performance goal"
  },
  {
    name: "Confidence Building → 'Handle complex problems confidently'",
    sessionData: { hints: 1, errors: 1, method: "equalization", exerciseType: "efficiency", completedWithSelfExplanation: false },
    currentProgress: { total: 4, substitution: 2, elimination: 1, equalization: 1, errorHistory: [2, 1, 3, 0], selfExplanations: 1 },
    expectedTriggeredGoals: ["Handle complex problems confidently"],
    explanation: "Completing 5+ total exercises should trigger confidence goal"
  },
  {
    name: "Accuracy Under Pressure → 'Maintain accuracy under pressure'",
    sessionData: { hints: 1, errors: 0, method: "substitution", exerciseType: "matching", completedWithSelfExplanation: false },
    currentProgress: { total: 4, substitution: 2, elimination: 2, equalization: 1, errorHistory: [1, 1, 0, 1], selfExplanations: 1 },
    expectedTriggeredGoals: ["Complete exercises without hints", "Solve problems with minimal errors", "Handle complex problems confidently", "Maintain accuracy under pressure"],
    explanation: "5+ exercises with ≤1 average error (current avg: 0.8) should trigger pressure goal"
  }
];

// Test Category 4: Learning & Growth Goals
const learningGrowthTests = [
  {
    name: "Building Confidence → 'Build confidence through success'",
    sessionData: { hints: 2, errors: 1, method: "elimination", exerciseType: "suitability", completedWithSelfExplanation: false },
    currentProgress: { total: 2, substitution: 1, elimination: 0, equalization: 0, errorHistory: [3, 2], selfExplanations: 0 },
    expectedTriggeredGoals: ["Understand how elimination works", "Build confidence through success"],
    explanation: "Using ≤2 hints should trigger confidence building goal"
  },
  {
    name: "Problem-solving Resilience → 'Develop problem-solving resilience'",
    sessionData: { hints: 3, errors: 2, method: "substitution", exerciseType: "efficiency", completedWithSelfExplanation: false },
    currentProgress: { total: 3, substitution: 2, elimination: 0, equalization: 0, errorHistory: [1, 0], selfExplanations: 0 },
    expectedTriggeredGoals: ["Develop problem-solving resilience"],
    explanation: "Making errors (>0) but completing exercise should trigger resilience goal"
  },
  {
    name: "Learning from Mistakes → 'Learn from mistakes effectively'",
    sessionData: { hints: 1, errors: 0, method: "equalization", exerciseType: "matching", completedWithSelfExplanation: false },
    currentProgress: { total: 5, substitution: 2, elimination: 2, equalization: 0, errorHistory: [3, 3, 2, 1], selfExplanations: 1 },
    expectedTriggeredGoals: ["Understand how equalization works", "Complete exercises without hints", "Solve problems with minimal errors", "Handle complex problems confidently", "Learn from mistakes effectively"],
    explanation: "Improving error trend (recent avg < old avg) should trigger learning goal"
  },
  {
    name: "Personal Challenges → 'Set personal learning challenges'",
    sessionData: { hints: 2, errors: 1, method: "substitution", exerciseType: "suitability", completedWithSelfExplanation: false },
    currentProgress: { total: 9, substitution: 4, elimination: 3, equalization: 2, errorHistory: [1, 2, 0, 1, 1, 0, 2, 1], selfExplanations: 3 },
    expectedTriggeredGoals: ["Set personal learning challenges"],
    explanation: "Completing 10+ total exercises shows commitment to challenges"
  },
  {
    name: "Track Progress → 'Track progress meaningfully'", 
    sessionData: { hints: 1, errors: 1, method: "equalization", exerciseType: "efficiency", completedWithSelfExplanation: false },
    currentProgress: { total: 6, substitution: 2, elimination: 2, equalization: 0, errorHistory: [2, 1, 1, 0, 2, 1], selfExplanations: 2 },
    expectedTriggeredGoals: ["Understand how equalization works", "Track progress meaningfully"],
    explanation: "Using all 3 methods (sub>0, elim>0, equal>0) should trigger tracking goal"
  },
  {
    name: "Method Reflection → 'Reflect on method effectiveness'",
    sessionData: { hints: 1, errors: 2, method: "elimination", exerciseType: "matching", completedWithSelfExplanation: true },
    currentProgress: { total: 4, substitution: 2, elimination: 1, equalization: 1, errorHistory: [1, 2, 0, 1], selfExplanations: 0 },
    expectedTriggeredGoals: ["Reflect on method effectiveness"],
    explanation: "Completing with self-explanation should trigger reflection goal"
  },
  {
    name: "Work Independently → 'Work independently' (3rd hint-free exercise)",
    sessionData: { hints: 0, errors: 1, method: "substitution", exerciseType: "suitability", completedWithSelfExplanation: false },
    currentProgress: { total: 8, substitution: 4, elimination: 2, equalization: 2, errorHistory: [2, 1, 0, 1, 0, 2, 1], selfExplanations: 2 },
    hintFreeCount: 2, // Already completed 2 hint-free exercises
    expectedTriggeredGoals: ["Complete exercises without hints", "Solve problems with minimal errors", "Work independently"],
    explanation: "Third hint-free exercise (0 hints) should trigger independence mastery"
  }
];

// Edge Cases & Error Conditions
const edgeCaseTests = [
  {
    name: "Method String vs Numeric Handling",
    sessionData: { hints: 1, errors: 0, method: "1", exerciseType: "suitability", completedWithSelfExplanation: false }, // numeric string
    currentProgress: { total: 0, substitution: 0, elimination: 0, equalization: 0, errorHistory: [], selfExplanations: 0 },
    expectedTriggeredGoals: ["Learn what linear equations are", "Understand how substitution works"],
    explanation: "Method '1' should be recognized as substitution"
  },
  {
    name: "Unknown Method Handling",
    sessionData: { hints: 2, errors: 1, method: "unknown_method", exerciseType: "efficiency", completedWithSelfExplanation: false },
    currentProgress: { total: 3, substitution: 1, elimination: 1, equalization: 1, errorHistory: [1, 2, 1], selfExplanations: 0 },
    expectedTriggeredGoals: [], // Should not trigger method-specific goals but might trigger others
    explanation: "Unknown method should be handled gracefully without crashing"
  },
  {
    name: "Already High Progress (6 substitution completions)",
    sessionData: { hints: 0, errors: 0, method: "substitution", exerciseType: "matching", completedWithSelfExplanation: true },
    currentProgress: { total: 12, substitution: 6, elimination: 3, equalization: 3, errorHistory: [1, 0, 1, 2, 0, 1, 0, 1, 1, 0, 2, 0], selfExplanations: 4 },
    expectedTriggeredGoals: [
      "Master substitution/equalization/elimination method", // Should trigger with >= 2 logic
      "Complete exercises without hints", 
      "Solve problems with minimal errors",
      "Show exceptional problem-solving",
      "Reflect on method effectiveness"
    ],
    explanation: "High progress should still trigger appropriate goals, especially mastery with >= 2 logic"
  }
];

// CONSOLIDATE ALL TESTS
const ALL_GOAL_TESTS = {
  basicUnderstanding: basicUnderstandingTests,
  methodMastery: methodMasteryTests, 
  problemSolving: problemSolvingTests,
  learningGrowth: learningGrowthTests,
  edgeCases: edgeCaseTests
};

console.log("📊 Goal triggering test cases defined:");
Object.keys(ALL_GOAL_TESTS).forEach(category => {
  console.log(`  ${category}: ${ALL_GOAL_TESTS[category].length} test cases`);
});

console.log("🎯 Total goal triggering tests: " + Object.values(ALL_GOAL_TESTS).flat().length);

// EXPORT FOR ACTUAL TESTING
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ALL_GOAL_TESTS };
}