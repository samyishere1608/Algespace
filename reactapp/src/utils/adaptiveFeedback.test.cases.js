// ✅ ADAPTIVE FEEDBACK TEST CASES
// Comprehensive test scenarios to verify pattern detection and feedback generation

console.log("🧪 ===== ADAPTIVE FEEDBACK TEST SUITE =====");

// Mock data for testing
const mockProgress = {
  total: 8,
  substitution: 3,
  elimination: 2,
  equalization: 1,
  errorHistory: [3, 2, 1, 1, 0, 1, 2, 0],
  selfExplanations: 2,
  suitability: 3,
  efficiency: 2,
  matching: 3
};

// Test Case 1: High Performance Pattern
const testHighPerformance = [
  {
    name: "Perfect Performance + High Confidence",
    data: {
      hints: 0, errors: 0, method: "substitution", exerciseType: "efficiency",
      completedWithSelfExplanation: false, userId: 1,
      postConfidence: 5, postSatisfaction: 5, postAnxiety: 1,
      updatedSuggestions: ["Master all three methods fluently"]
    },
    expectedPattern: "high_performance",
    expectedConfidence: 0.9,
    expectedMessage: /Outstanding.*Perfect execution.*updated your goals/
  },
  {
    name: "Perfect Performance + No Reflection Data", 
    data: {
      hints: 0, errors: 0, method: "elimination", exerciseType: "suitability",
      completedWithSelfExplanation: false, userId: 1,
      updatedSuggestions: ["Show exceptional problem-solving"]
    },
    expectedPattern: "high_performance",
    expectedConfidence: 0.8,
    expectedMessage: /Outstanding.*Perfect execution/
  },
  {
    name: "Good Performance + Partial Reflection",
    data: {
      hints: 1, errors: 0, method: "substitution", exerciseType: "matching",
      completedWithSelfExplanation: true, userId: 1,
      postConfidence: 4, postSatisfaction: 3,
      updatedSuggestions: ["Work independently"]
    },
    expectedPattern: "high_performance", 
    expectedConfidence: 0.7,
    expectedMessage: /Excellent work.*Only 1 hints and 0 errors/
  }
];

// Test Case 2: Struggling Pattern
const testStruggling = [
  {
    name: "High Struggles + High Anxiety",
    data: {
      hints: 5, errors: 4, method: "equalization", exerciseType: "efficiency", 
      completedWithSelfExplanation: false, userId: 1,
      postConfidence: 1, postSatisfaction: 1, postAnxiety: 5,
      updatedSuggestions: ["Learn what linear equations are", "Build confidence through success"]
    },
    expectedPattern: "struggling",
    expectedConfidence: 0.9,
    expectedMessage: /feeling anxious.*persisted through 4 errors.*adjusted your goal recommendations/
  },
  {
    name: "Moderate Struggles",
    data: {
      hints: 3, errors: 2, method: "substitution", exerciseType: "suitability",
      completedWithSelfExplanation: false, userId: 1,
      postConfidence: 3, postSatisfaction: 3,
      updatedSuggestions: ["Understand how substitution works"]
    },
    expectedPattern: "struggling",
    expectedConfidence: 0.7,
    expectedMessage: /Working through 2 errors.*using 3 hints.*updated your goals/
  },
  {
    name: "High Hints Only",
    data: {
      hints: 4, errors: 1, method: "elimination", exerciseType: "matching",
      completedWithSelfExplanation: false, userId: 1,
      updatedSuggestions: ["Build confidence through success"]
    },
    expectedPattern: "struggling",
    expectedConfidence: 0.7,
    expectedMessage: /Working through 1 errors.*using 4 hints/
  }
];

// Test Case 3: Consistent Improvement Pattern
const testConsistentImprovement = [
  {
    name: "Clear Improvement Trend",
    data: {
      hints: 1, errors: 1, method: "substitution", exerciseType: "efficiency",
      completedWithSelfExplanation: true, userId: 1,
      updatedSuggestions: ["Show consistent improvement", "Learn from mistakes effectively"]
    },
    expectedPattern: "consistent_improvement",
    expectedConfidence: 0.8,
    expectedMessage: /Amazing progress.*error rate improved.*updated your goals.*improvement streak/
  }
];

// Test Case 4: Mixed Performance Pattern  
const testMixedPerformance = [
  {
    name: "Good Technical + Low Satisfaction",
    data: {
      hints: 2, errors: 1, method: "equalization", exerciseType: "suitability",
      completedWithSelfExplanation: false, userId: 1,
      postConfidence: 4, postSatisfaction: 2, postAnxiety: 2,
      updatedSuggestions: ["Build confidence through success"]
    },
    expectedPattern: "mixed_performance",
    expectedConfidence: 0.7,
    expectedMessage: /technically doing well.*sense some frustration.*adjusted your goals/
  },
  {
    name: "Good Technical + High Anxiety",
    data: {
      hints: 1, errors: 2, method: "substitution", exerciseType: "matching", 
      completedWithSelfExplanation: false, userId: 1,
      postConfidence: 3, postSatisfaction: 3, postAnxiety: 4,
      updatedSuggestions: ["Develop problem-solving resilience"]
    },
    expectedPattern: "mixed_performance",
    expectedConfidence: 0.7,
    expectedMessage: /Good technical performance.*want you to feel more confident/
  }
];

// Test Case 5: Building Confidence Pattern
const testBuildingConfidence = [
  {
    name: "Moderate Performance + Good Confidence",
    data: {
      hints: 2, errors: 1, method: "elimination", exerciseType: "efficiency",
      completedWithSelfExplanation: true, userId: 1,
      postConfidence: 4, postSatisfaction: 3, postAnxiety: 2,
      updatedSuggestions: ["Handle complex problems confidently"]
    },
    expectedPattern: "building_confidence",
    expectedConfidence: 0.6,
    expectedMessage: /Great work.*building solid skills.*confidence is growing.*updated your goals/
  },
  {
    name: "Good Performance + No Reflection Data",
    data: {
      hints: 1, errors: 2, method: "substitution", exerciseType: "suitability",
      completedWithSelfExplanation: false, userId: 1,
      updatedSuggestions: ["Practice with different methods"]
    },
    expectedPattern: "building_confidence", 
    expectedConfidence: 0.6,
    expectedMessage: /Great work.*building solid skills.*Keep building on this foundation/
  }
];

// Test Case 6: Generic Pattern
const testGeneric = [
  {
    name: "Average Performance + No Special Conditions",
    data: {
      hints: 3, errors: 3, method: "equalization", exerciseType: "matching",
      completedWithSelfExplanation: false, userId: 999, // New user with no history
      postConfidence: 3, postSatisfaction: 3, postAnxiety: 3,
      updatedSuggestions: ["Learn what linear equations are"]
    },
    expectedPattern: "generic",
    expectedConfidence: 0.3,
    expectedMessage: /Nice work.*updated your recommended goals/
  },
  {
    name: "No Updated Suggestions",
    data: {
      hints: 2, errors: 3, method: "substitution", exerciseType: "efficiency", 
      completedWithSelfExplanation: false, userId: 999
    },
    expectedPattern: "generic", 
    expectedConfidence: 0.3,
    expectedMessage: /Good effort.*Keep practicing/
  }
];

// Test Case 7: Edge Cases & Conflicts
const testEdgeCases = [
  {
    name: "Boundary Case: hints=2, errors=2 (Could be multiple patterns)",
    data: {
      hints: 2, errors: 2, method: "elimination", exerciseType: "suitability",
      completedWithSelfExplanation: false, userId: 1,
      postConfidence: 2, postSatisfaction: 2, postAnxiety: 4,
      updatedSuggestions: ["Build confidence through success"]
    },
    expectedPattern: "mixed_performance", // Should prioritize mixed over building_confidence
    expectedConfidence: 0.7,
    expectedMessage: /technically doing well.*sense some frustration/
  },
  {
    name: "Missing All Reflection Data",
    data: {
      hints: 1, errors: 0, method: "substitution", exerciseType: "efficiency",
      completedWithSelfExplanation: true, userId: 1,
      updatedSuggestions: ["Master substitution/equalization/elimination method"]
    },
    expectedPattern: "building_confidence", // Should default appropriately
    expectedConfidence: 0.6,
    expectedMessage: /Great work.*building solid skills/
  },
  {
    name: "Very New User (userId=1000, no progress history)",
    data: {
      hints: 0, errors: 0, method: "substitution", exerciseType: "suitability",
      completedWithSelfExplanation: false, userId: 1000,
      updatedSuggestions: ["Learn what linear equations are"]
    },
    expectedPattern: "high_performance",
    expectedConfidence: 0.8,
    expectedMessage: /Outstanding.*Perfect execution/
  }
];

// EXPORT ALL TEST CASES
const ALL_TEST_CASES = {
  highPerformance: testHighPerformance,
  struggling: testStruggling, 
  consistentImprovement: testConsistentImprovement,
  mixedPerformance: testMixedPerformance,
  buildingConfidence: testBuildingConfidence,
  generic: testGeneric,
  edgeCases: testEdgeCases
};

console.log("📊 Test cases defined:");
Object.keys(ALL_TEST_CASES).forEach(category => {
  console.log(`  ${category}: ${ALL_TEST_CASES[category].length} test cases`);
});

console.log("🎯 Total test cases: " + Object.values(ALL_TEST_CASES).flat().length);

// EXPORT FOR ACTUAL TESTING
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { ALL_TEST_CASES, mockProgress };
}