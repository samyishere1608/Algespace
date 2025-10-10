// 🧪 ADAPTIVE FEEDBACK TEST COMPONENT (Updated for Today's Modifications)
// Comprehensive tests for adaptive feedback, goal recommendations, and system integration

import { useState } from 'react';
import { detectPerformancePattern, generateAdaptiveFeedback } from '../../utils/adaptiveFeedback';
import { getExerciseProgress, checkProgressiveGoals, saveExerciseSession, getExerciseSession } from '../../utils/progressiveGoalTracking';
import { updateGoalSuggestions } from '../../utils/api';

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
}

export function AdaptiveFeedbackTestComponent() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [completedGoals, setCompletedGoals] = useState<string[]>([]);

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setCompletedGoals([]);
    
    const results: TestResult[] = [];

    // 🎯 TEST 1: HIGH PERFORMANCE PATTERN (Perfect execution)
    try {
      const highPerfData = {
        hints: 0, errors: 0, method: "substitution", exerciseType: "efficiency",
        completedWithSelfExplanation: false, userId: 1,
        postConfidence: 5, postSatisfaction: 5, postAnxiety: 1,
        updatedSuggestions: ["Master all three methods fluently"]
      };
      
      const pattern = detectPerformancePattern(highPerfData);
      const feedback = generateAdaptiveFeedback(highPerfData);
      
      results.push({
        name: "1️⃣ High Performance (Perfect)",
        passed: pattern.pattern === 'high_performance' && feedback.includes('Outstanding'),
        expected: "high_performance pattern with 'Outstanding' message",
        actual: `${pattern.pattern} (${pattern.confidence}) - ${feedback.substring(0, 50)}...`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "1️⃣ High Performance (Perfect)", 
        passed: false,
        expected: "high_performance pattern",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 2: HIGH PERFORMANCE PATTERN (Good but not perfect)
    try {
      const goodPerfData = {
        hints: 1, errors: 0, method: "elimination", exerciseType: "suitability",
        completedWithSelfExplanation: true, userId: 1,
        postConfidence: 4, postSatisfaction: 4, postAnxiety: 2,
        updatedSuggestions: ["Tackle more advanced problems"]
      };
      
      const pattern = detectPerformancePattern(goodPerfData);
      const feedback = generateAdaptiveFeedback(goodPerfData);
      
      results.push({
        name: "2️⃣ High Performance (Good)",
        passed: pattern.pattern === 'high_performance' && feedback.includes('Excellent'),
        expected: "high_performance pattern with 'Excellent' message",
        actual: `${pattern.pattern} (${pattern.confidence}) - ${feedback.substring(0, 50)}...`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "2️⃣ High Performance (Good)",
        passed: false,
        expected: "high_performance pattern",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 3: STRUGGLING PATTERN (High anxiety)
    try {
      const strugglingData = {
        hints: 5, errors: 4, method: "equalization", exerciseType: "matching",
        completedWithSelfExplanation: false, userId: 1,
        postConfidence: 1, postSatisfaction: 2, postAnxiety: 5,
        updatedSuggestions: ["Build confidence through success"]
      };
      
      const pattern = detectPerformancePattern(strugglingData);
      const feedback = generateAdaptiveFeedback(strugglingData);
      
      results.push({
        name: "3️⃣ Struggling (High Anxiety)",
        passed: pattern.pattern === 'struggling' && feedback.includes('anxious'),
        expected: "struggling pattern with anxiety message",
        actual: `${pattern.pattern} (${pattern.confidence}) - ${feedback.substring(0, 50)}...`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "3️⃣ Struggling (High Anxiety)",
        passed: false, 
        expected: "struggling pattern",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 4: STRUGGLING PATTERN (Many errors, no reflection data)
    try {
      const strugglingBasicData = {
        hints: 6, errors: 5, method: "substitution", exerciseType: "efficiency",
        completedWithSelfExplanation: false, userId: 1,
        updatedSuggestions: ["Start with easier problems"]
      };
      
      const pattern = detectPerformancePattern(strugglingBasicData);
      const feedback = generateAdaptiveFeedback(strugglingBasicData);
      
      results.push({
        name: "4️⃣ Struggling (Basic)",
        passed: pattern.pattern === 'struggling' && feedback.includes('determination'),
        expected: "struggling pattern with basic encouragement",
        actual: `${pattern.pattern} (${pattern.confidence}) - ${feedback.substring(0, 50)}...`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "4️⃣ Struggling (Basic)",
        passed: false,
        expected: "struggling pattern",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 5: CONSISTENT IMPROVEMENT PATTERN
    try {
      // Set up improvement history: started with many errors, now improving
      localStorage.setItem('exerciseProgress_1', JSON.stringify({
        substitution: 6, elimination: 0, equalization: 0, total: 6,
        errorHistory: [5, 4, 4, 3, 2, 1], // Clear improvement trend
        selfExplanations: 2, suitability: 3, efficiency: 2, matching: 1
      }));
      
      const improvementData = {
        hints: 2, errors: 1, method: "substitution", exerciseType: "suitability",
        completedWithSelfExplanation: true, userId: 1,
        postConfidence: 3, postSatisfaction: 4,
        updatedSuggestions: ["Continue this excellent progress"]
      };
      
      const pattern = detectPerformancePattern(improvementData);
      const feedback = generateAdaptiveFeedback(improvementData);
      
      results.push({
        name: "5️⃣ Consistent Improvement",
        passed: pattern.pattern === 'consistent_improvement' && feedback.includes('progress'),
        expected: "consistent_improvement pattern with progress message",
        actual: `${pattern.pattern} (${pattern.confidence}) - ${feedback.substring(0, 50)}...`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Full Message: ${feedback}\n✅ Error History: [5,4,4,3,2,1] shows improvement`
      });
    } catch (error) {
      results.push({
        name: "5️⃣ Consistent Improvement",
        passed: false,
        expected: "consistent_improvement pattern",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 6: MIXED PERFORMANCE PATTERN (Good technical, low satisfaction)
    try {
      // Reset progress to avoid improvement pattern interference
      localStorage.setItem('exerciseProgress_1', JSON.stringify({
        substitution: 2, elimination: 1, equalization: 0, total: 3,
        errorHistory: [2, 2], // Short history to avoid improvement pattern (length < 3)
        selfExplanations: 1, suitability: 1, efficiency: 1, matching: 1
      }));
      
      const mixedData = {
        hints: 1, errors: 2, method: "elimination", exerciseType: "matching",
        completedWithSelfExplanation: false, userId: 1,
        postConfidence: 3, postSatisfaction: 1, postAnxiety: 2, // satisfaction=1 ≤ 2, so should trigger mixed
        updatedSuggestions: ["Focus on enjoyment and engagement"]
      };
      
      const pattern = detectPerformancePattern(mixedData);
      const feedback = generateAdaptiveFeedback(mixedData);
      
      results.push({
        name: "6️⃣ Mixed Performance (Low Satisfaction)",
        passed: pattern.pattern === 'mixed_performance' && feedback.includes('frustration'),
        expected: "mixed_performance pattern with frustration acknowledgment",
        actual: `${pattern.pattern} (${pattern.confidence}) - ${feedback.substring(0, 50)}...`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Logic: hints=1≤2 ✓, errors=2≤2 ✓, satisfaction=1≤2 ✓ → mixed_performance\n✅ Should get LOW SATISFACTION branch: 'frustration' message\n✅ Avoided improvement pattern: errorHistory.length=2 < 3\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "6️⃣ Mixed Performance (Low Satisfaction)",
        passed: false,
        expected: "mixed_performance pattern",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 7: MIXED PERFORMANCE PATTERN (Good technical, high anxiety)
    try {
      // Reset progress to avoid improvement pattern interference  
      localStorage.setItem('exerciseProgress_1', JSON.stringify({
        substitution: 1, elimination: 2, equalization: 0, total: 3,
        errorHistory: [1, 1], // Short history to avoid improvement pattern (length < 3)
        selfExplanations: 1, suitability: 1, efficiency: 1, matching: 1
      }));
      
      const mixedAnxietyData = {
        hints: 2, errors: 1, method: "equalization", exerciseType: "efficiency",
        completedWithSelfExplanation: true, userId: 1,
        postConfidence: 4, postSatisfaction: 3, postAnxiety: 5, // anxiety=5≥4, satisfaction=3>2
        updatedSuggestions: ["Build confidence while maintaining skills"]
      };
      
      const pattern = detectPerformancePattern(mixedAnxietyData);
      const feedback = generateAdaptiveFeedback(mixedAnxietyData);
      
      results.push({
        name: "7️⃣ Mixed Performance (High Anxiety)",
        passed: pattern.pattern === 'mixed_performance' && feedback.includes('Good technical performance'),
        expected: "mixed_performance pattern with 'Good technical performance' message",
        actual: `${pattern.pattern} (${pattern.confidence}) - ${feedback.substring(0, 50)}...`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Logic: hints=2≤2 ✓, errors=1≤2 ✓, anxiety=5≥4 ✓ → mixed_performance\n✅ Should get HIGH ANXIETY branch: 'Good technical performance' message\n✅ Avoided improvement pattern: errorHistory.length=2 < 3\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "7️⃣ Mixed Performance (High Anxiety)",
        passed: false,
        expected: "mixed_performance pattern",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 8: BUILDING CONFIDENCE PATTERN
    try {
      // Reset progress for clean confidence building test
      localStorage.setItem('exerciseProgress_1', JSON.stringify({
        substitution: 3, elimination: 1, equalization: 0, total: 4,
        errorHistory: [2, 1, 2, 1], selfExplanations: 2,
        suitability: 2, efficiency: 1, matching: 1
      }));
      
      const confidenceData = {
        hints: 2, errors: 1, method: "substitution", exerciseType: "suitability",
        completedWithSelfExplanation: true, userId: 1,
        postConfidence: 4, postSatisfaction: 4, postAnxiety: 1, // Good emotional data to avoid mixed performance
        updatedSuggestions: ["Keep building on solid foundation"]
      };
      
      const pattern = detectPerformancePattern(confidenceData);
      const feedback = generateAdaptiveFeedback(confidenceData);
      
      results.push({
        name: "8️⃣ Building Confidence",
        passed: pattern.pattern === 'building_confidence' && feedback.includes('confidence'),
        expected: "building_confidence pattern with confidence message",
        actual: `${pattern.pattern} (${pattern.confidence}) - ${feedback.substring(0, 50)}...`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "8️⃣ Building Confidence",
        passed: false,
        expected: "building_confidence pattern",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 9: GENERIC PATTERN (Fallback)
    try {
      // Reset progress to have total < 2 to avoid building confidence pattern
      localStorage.setItem('exerciseProgress_1', JSON.stringify({
        substitution: 1, elimination: 0, equalization: 0, total: 1, // total=1 < 2
        errorHistory: [2], selfExplanations: 0, suitability: 1, efficiency: 0, matching: 0
      }));
      
      const genericData = {
        hints: 2, errors: 2, method: "elimination", exerciseType: "matching", 
        completedWithSelfExplanation: false, userId: 1,
        postConfidence: 2, postSatisfaction: 3, postAnxiety: 3, // confidence=2 < 3 to avoid building confidence
        updatedSuggestions: ["Keep practicing and improving"]
      };
      
      const pattern = detectPerformancePattern(genericData);
      const feedback = generateAdaptiveFeedback(genericData);
      
      results.push({
        name: "9️⃣ Generic Pattern (Fallback)",
        passed: pattern.pattern === 'generic' && feedback.includes('Nice work'),
        expected: "generic pattern with encouraging message",
        actual: `${pattern.pattern} (${pattern.confidence}) - ${feedback.substring(0, 50)}...`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Logic Check:\n  - Struggling: hints=2≥3? false, errors=2≥3? false\n  - High Perf: hints=2≤1? false, errors=2≤1? false\n  - Mixed Perf: hints≤2✓, errors≤2✓, but sat=3>2 & anx=3<4 → no trigger\n  - Building Conf: hints≤2✓, errors≤2✓, total=1<2✗ → no trigger\n  - Should fallback to GENERIC\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "9️⃣ Generic Pattern (Fallback)",
        passed: false,
        expected: "generic pattern",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 10: PATTERN PRIORITY TEST (Struggling should override others)
    try {
      const priorityData = {
        hints: 4, errors: 4, method: "substitution", exerciseType: "efficiency",
        completedWithSelfExplanation: true, userId: 1,
        postConfidence: 4, postSatisfaction: 4, postAnxiety: 2, // Good reflection data
        updatedSuggestions: ["Need support despite good feelings"]
      };
      
      const pattern = detectPerformancePattern(priorityData);
      const feedback = generateAdaptiveFeedback(priorityData);
      
      results.push({
        name: "🔟 Pattern Priority (Struggling Override)",
        passed: pattern.pattern === 'struggling',
        expected: "struggling pattern (should override good reflection data)",
        actual: `${pattern.pattern} (${pattern.confidence}) - Technical: 4 hints, 4 errors but good reflection`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ Logic: High hints/errors should trigger struggling despite good emotional data\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "🔟 Pattern Priority (Struggling Override)",
        passed: false,
        expected: "struggling pattern priority",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 11: PROGRESSIVE GOAL TRIGGERING (Your Substitution Case)
    try {
      // Mock your progress with 6 substitution completions
      localStorage.setItem('exerciseProgress_1', JSON.stringify({
        substitution: 6, elimination: 0, equalization: 0, total: 6,
        errorHistory: [2, 1, 0, 1, 0, 1], selfExplanations: 1,
        suitability: 2, efficiency: 2, matching: 2
      }));
      
      const triggeredGoals: string[] = [];
      const mockCompleteGoal = (title: string) => {
        triggeredGoals.push(title);
        setCompletedGoals(prev => [...prev, title]);
      };
      
      const sessionData = {
        hints: 1, errors: 0, method: "substitution", exerciseType: "efficiency",
        completedWithSelfExplanation: false
      };
      
      checkProgressiveGoals(1, sessionData, mockCompleteGoal);
      
      const masteryTriggered = triggeredGoals.some(goal => goal.includes("Master") && goal.includes("substitution"));
      
      results.push({
        name: "1️⃣1️⃣ Substitution Mastery Goal (Your Case)",
        passed: masteryTriggered,
        expected: "Should trigger mastery goal with 6 substitution completions",
        actual: `Triggered goals: ${triggeredGoals.join(', ') || 'None'}`,
        details: `✅ Progress check: substitution=6 >= 2? Should be true\n✅ Fixed from == 2 to >= 2 comparison\n✅ All triggered goals: ${triggeredGoals.join(', ')}`
      });
    } catch (error) {
      results.push({
        name: "1️⃣1️⃣ Substitution Mastery Goal",
        passed: false,
        expected: "Master substitution goal",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 12: PERFECT PERFORMANCE GOAL INTEGRATION
    try {
      // Reset for clean perfect performance test
      localStorage.setItem('exerciseProgress_1', JSON.stringify({
        substitution: 3, elimination: 2, equalization: 1, total: 6,
        errorHistory: [0, 0, 0], selfExplanations: 3,
        suitability: 2, efficiency: 2, matching: 2
      }));
      
      const sessionData = {
        hints: 0, errors: 0, method: "substitution", exerciseType: "efficiency",
        completedWithSelfExplanation: true
      };
      
      const triggeredGoals: string[] = [];
      const mockCompleteGoal = (title: string) => {
        triggeredGoals.push(title);
        setCompletedGoals(prev => [...prev, title]);
      };
      
      checkProgressiveGoals(1, sessionData, mockCompleteGoal);
      
      // Check if perfect performance triggers appropriate goals
      const perfectGoalsFound = triggeredGoals.length > 0;
      
      results.push({
        name: "1️⃣2️⃣ Perfect Performance Goal Triggering",
        passed: perfectGoalsFound,
        expected: "Should trigger goals for perfect performance (0 hints, 0 errors)",
        actual: `Triggered: ${triggeredGoals.join(', ') || 'None'}`,
        details: `✅ Perfect session (0 hints, 0 errors, self-explanation)\n✅ Should trigger multiple appropriate goals\n✅ All triggered goals: ${triggeredGoals.join(', ')}`
      });
    } catch (error) {
      results.push({
        name: "1️⃣2️⃣ Perfect Performance Goal Triggering",
        passed: false,
        expected: "Multiple perfect performance goals", 
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 13: METHOD STRING HANDLING (Edge Case)
    try {
      const sessionData = {
        hints: 2, errors: 1, method: "1", exerciseType: "suitability",  // numeric string
        completedWithSelfExplanation: false
      };
      
      const triggeredGoals: string[] = [];
      const mockCompleteGoal = (title: string) => triggeredGoals.push(title);
      
      // Reset progress for clean test
      localStorage.setItem('exerciseProgress_1', JSON.stringify({
        substitution: 1, elimination: 0, equalization: 0, total: 1,
        errorHistory: [1], selfExplanations: 0, suitability: 1, efficiency: 0, matching: 0
      }));
      
      checkProgressiveGoals(1, sessionData, mockCompleteGoal);
      
      const substitutionGoalTriggered = triggeredGoals.some(goal => 
        goal.includes("substitution") || goal.includes("Understand how")
      );
      
      results.push({
        name: "1️⃣3️⃣ Method String Handling (method='1')",
        passed: substitutionGoalTriggered,
        expected: "Should recognize '1' as substitution method",
        actual: `Triggered: ${triggeredGoals.join(', ') || 'None'}`,
        details: `✅ Method '1' should be converted to substitution\n✅ Should trigger understanding/progress goals\n✅ All triggered goals: ${triggeredGoals.join(', ')}`
      });
    } catch (error) {
      results.push({
        name: "1️⃣3️⃣ Method String Handling",
        passed: false,
        expected: "Handle method='1' as substitution",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 14: SELF-EXPLANATION GOALS
    try {
      // Reset progress
      localStorage.setItem('exerciseProgress_1', JSON.stringify({
        substitution: 0, elimination: 0, equalization: 0, total: 0,
        errorHistory: [], selfExplanations: 0, suitability: 0, efficiency: 0, matching: 0
      }));
      
      const sessionData = {
        hints: 1, errors: 1, method: "elimination", exerciseType: "matching",
        completedWithSelfExplanation: true  // Key: with self-explanation
      };
      
      const triggeredGoals: string[] = [];
      const mockCompleteGoal = (title: string) => triggeredGoals.push(title);
      
      checkProgressiveGoals(1, sessionData, mockCompleteGoal);
      
      const selfExplanationGoals = triggeredGoals.some(goal => 
        goal.includes("Reflect on method effectiveness") || goal.includes("Clear reasoning")
      );
      
      results.push({
        name: "1️⃣4️⃣ Self-Explanation Goal Triggering",
        passed: selfExplanationGoals,
        expected: "Should trigger 'Reflect on method effectiveness' goal",
        actual: `Triggered: ${triggeredGoals.join(', ') || 'None'}`,
        details: `✅ Session completed WITH self-explanation\n✅ Should trigger "Reflect on method effectiveness"\n✅ All triggered goals: ${triggeredGoals.join(', ')}`
      });
    } catch (error) {
      results.push({
        name: "1️⃣4️⃣ Self-Explanation Goal Triggering",
        passed: false,
        expected: "Self-explanation goals",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 15: EDGE CASE - NO REFLECTION DATA
    try {
      const noReflectionData = {
        hints: 2, errors: 2, method: "equalization", exerciseType: "suitability",
        completedWithSelfExplanation: false, userId: 1,
        // No post-reflection data at all
        updatedSuggestions: ["Default suggestions without reflection"]
      };
      
      const pattern = detectPerformancePattern(noReflectionData);
      const feedback = generateAdaptiveFeedback(noReflectionData);
      
      results.push({
        name: "1️⃣5️⃣ No Reflection Data (Edge Case)",
        passed: pattern.pattern !== undefined && feedback.length > 0,
        expected: "Should handle missing reflection data gracefully",
        actual: `${pattern.pattern} (${pattern.confidence}) - Generated feedback successfully`,
        details: `✅ Pattern: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ No crash with missing reflection data\n✅ Full Message: ${feedback}`
      });
    } catch (error) {
      results.push({
        name: "1️⃣5️⃣ No Reflection Data (Edge Case)",
        passed: false,
        expected: "Handle missing reflection data",
        actual: `Error: ${error}`
      });
    }

    // 🎯 NEW TESTS: TODAY'S MODIFICATIONS & GOAL RECOMMENDATIONS
    
    // 🎯 TEST 16: Session Data Persistence (Today's Fix)
    try {
      const testUserId = 888;
      const testExerciseType = "efficiency";
      const testExerciseId = 123;
      const mockSession = {
        hints: 3,
        errors: 2,
        method: "elimination",
        exerciseType: testExerciseType,
        completedWithSelfExplanation: true
      };
      
      // Save session data with correct parameters
      saveExerciseSession(testUserId, testExerciseType, testExerciseId, mockSession);
      
      // Retrieve session data with correct parameters
      const retrievedSession = getExerciseSession(testUserId, testExerciseType, testExerciseId);
      
      const sessionMatches = retrievedSession && 
                            retrievedSession.hints === mockSession.hints &&
                            retrievedSession.errors === mockSession.errors &&
                            retrievedSession.method === mockSession.method;
      
      results.push({
        name: "1️⃣6️⃣ Session Data Persistence (Today's Fix)",
        passed: !!sessionMatches,
        expected: "Session data saved and retrieved correctly",
        actual: sessionMatches ? 
          `✅ All session data matches: hints=${retrievedSession.hints}, errors=${retrievedSession.errors}` :
          `❌ Data mismatch or retrieval failed`,
        details: sessionMatches && retrievedSession ? 
          `✅ Hints: ${retrievedSession.hints}\n✅ Errors: ${retrievedSession.errors}\n✅ Method: ${retrievedSession.method}\n✅ Self-explanation: ${retrievedSession.completedWithSelfExplanation}` :
          '❌ Session data persistence failed'
      });
    } catch (error) {
      results.push({
        name: "1️⃣6️⃣ Session Data Persistence (Today's Fix)",
        passed: false,
        expected: "Session data persistence working",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 17: Goal Recommendation API Integration
    try {
      const testUserId = 777;
      const recommendations = await updateGoalSuggestions(testUserId);
      
      const isValidResponse = Array.isArray(recommendations);
      const hasProperFormat = recommendations.length > 0 && 
                              recommendations.every(rec => typeof rec === 'string' && rec.includes('|'));
      
      results.push({
        name: "1️⃣7️⃣ Goal Recommendation API Integration", 
        passed: isValidResponse && hasProperFormat,
        expected: "Array of formatted goal recommendations (Category|Title|Difficulty)",
        actual: isValidResponse ? 
          `✅ ${recommendations.length} recommendations: ${recommendations.slice(0, 2).join(', ')}...` :
          `❌ Invalid response: ${typeof recommendations}`,
        details: isValidResponse && hasProperFormat ?
          `✅ API call successful\n✅ Format validation passed\n✅ Recommendations:\n${recommendations.map(r => `  • ${r}`).join('\n')}` :
          '❌ API integration failed'
      });
    } catch (error) {
      results.push({
        name: "1️⃣7️⃣ Goal Recommendation API Integration",
        passed: false,
        expected: "Goal recommendations retrieved successfully",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 18: Single Source of Truth (Today's Architecture Fix)
    try {
      const testUserId = 666;
      const testExerciseType = "efficiency";
      const testExerciseId = 456;
      
      // Test the unified feedback flow: Session → Adaptive Feedback
      const mockSessionData = {
        hints: 4,
        errors: 3,
        method: "substitution",
        exerciseType: testExerciseType,
        completedWithSelfExplanation: false
      };
      
      // Save session (simulating exercise completion) with correct parameters
      saveExerciseSession(testUserId, testExerciseType, testExerciseId, mockSessionData);
      
      // Retrieve session (simulating GoalList.tsx behavior) with correct parameters
      const sessionForFeedback = getExerciseSession(testUserId, testExerciseType, testExerciseId);
      
      if (sessionForFeedback) {
        // Generate feedback using the session data (the single source of truth)
        const feedbackData = {
          hints: sessionForFeedback.hints,
          errors: sessionForFeedback.errors,
          method: sessionForFeedback.method || "substitution",
          exerciseType: testExerciseType,
          completedWithSelfExplanation: sessionForFeedback.completedWithSelfExplanation || false,
          userId: testUserId,
          postSatisfaction: 3,
          postConfidence: 3,
          postAnxiety: 3,
          updatedSuggestions: ["Method Mastery|Practice with different methods|easy"]
        };
        
        const adaptiveFeedback = generateAdaptiveFeedback(feedbackData);
        
        const singleSourceWorking = adaptiveFeedback && adaptiveFeedback.length > 0;
        
        results.push({
          name: "1️⃣8️⃣ Single Source of Truth Architecture",
          passed: !!singleSourceWorking,
          expected: "Unified flow: Session → Retrieval → Adaptive Feedback",
          actual: singleSourceWorking ? 
            `✅ Architecture working: "${adaptiveFeedback.substring(0, 60)}..."` :
            '❌ Single source flow broken',
          details: singleSourceWorking ?
            `✅ Session saved successfully\n✅ Session retrieved correctly\n✅ Adaptive feedback generated\n✅ Full feedback: "${adaptiveFeedback}"` :
            '❌ Single source of truth architecture broken'
        });
      } else {
        results.push({
          name: "1️⃣8️⃣ Single Source of Truth Architecture",
          passed: false,
          expected: "Session data retrieved successfully",
          actual: "Session data not found after saving"
        });
      }
    } catch (error) {
      results.push({
        name: "1️⃣8️⃣ Single Source of Truth Architecture",
        passed: false,
        expected: "Single source architecture working",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 19: Specific Bug Fix - "4 errors + 5 hints + anxiety=5" Case
    try {
      const bugFixData = {
        hints: 5,
        errors: 4,
        method: "elimination",
        exerciseType: "suitability",
        completedWithSelfExplanation: false,
        userId: 1,
        postSatisfaction: 2,
        postDifficulty: 5,
        postConfidence: 2,
        postAnxiety: 5,  // High anxiety - key trigger for struggling pattern
        updatedSuggestions: ["Build confidence through success"]
      };
      
      const pattern = detectPerformancePattern(bugFixData);
      const feedback = generateAdaptiveFeedback(bugFixData);
      
      const correctPatternDetected = pattern.pattern === 'struggling';
      const noOutstandingMessage = !feedback.toLowerCase().includes('outstanding');
      const hasStrugglingMessage = feedback.toLowerCase().includes('anxious') || 
                                   feedback.toLowerCase().includes('struggle') ||
                                   feedback.toLowerCase().includes('challenge');
      
      const bugFixed = correctPatternDetected && noOutstandingMessage && hasStrugglingMessage;
      
      results.push({
        name: "1️⃣9️⃣ Bug Fix: 4 errors + 5 hints + anxiety=5 Case",
        passed: bugFixed,
        expected: "STRUGGLING pattern (NOT outstanding performance)",
        actual: bugFixed ? 
          `✅ Correct: ${pattern.pattern} pattern detected` :
          `❌ Wrong: ${pattern.pattern} pattern, message contains: ${feedback.substring(0, 100)}`,
        details: bugFixed ?
          `✅ Pattern detected: ${pattern.pattern} (confidence: ${pattern.confidence})\n✅ No 'outstanding' message\n✅ Appropriate struggling feedback\n✅ Full message: "${feedback}"` :
          `❌ Bug not fixed\n❌ Pattern: ${pattern.pattern}\n❌ Message: "${feedback}"`
      });
    } catch (error) {
      results.push({
        name: "1️⃣9️⃣ Bug Fix: 4 errors + 5 hints + anxiety=5 Case",
        passed: false,
        expected: "Specific bug fix working",
        actual: `Error: ${error}`
      });
    }

    // 🎯 TEST 20: Performance Pattern Priority (Today's Enhancement)
    try {
      // Test that struggling pattern takes priority over generic patterns
      const multiplePatternData = {
        hints: 3,
        errors: 3,
        method: "equalization",
        exerciseType: "matching",
        completedWithSelfExplanation: false,
        userId: 1,
        postSatisfaction: 3,
        postDifficulty: 4,
        postConfidence: 2,
        postAnxiety: 5,  // This should trigger struggling pattern
        updatedSuggestions: ["Learning & Growth|Build confidence through success|easy"]
      };
      
      const pattern = detectPerformancePattern(multiplePatternData);
      const priorityCorrect = pattern.pattern === 'struggling'; // Should prioritize struggling due to high anxiety
      
      results.push({
        name: "2️⃣0️⃣ Performance Pattern Priority Logic",
        passed: priorityCorrect,
        expected: "Struggling pattern prioritized over generic patterns",
        actual: priorityCorrect ? 
          `✅ Correct priority: ${pattern.pattern} (confidence: ${pattern.confidence})` :
          `❌ Wrong priority: ${pattern.pattern} instead of struggling`,
        details: priorityCorrect ?
          `✅ Pattern priority working correctly\n✅ High anxiety (5) triggered struggling pattern\n✅ Confidence: ${pattern.confidence}` :
          `❌ Pattern priority logic needs adjustment\n❌ Expected: struggling\n❌ Actual: ${pattern.pattern}`
      });
    } catch (error) {
      results.push({
        name: "2️⃣0️⃣ Performance Pattern Priority Logic",
        passed: false,
        expected: "Pattern priority working",
        actual: `Error: ${error}`
      });
    }

    setTestResults(results);
    setIsRunning(false);
  };

  const passedTests = testResults.filter(r => r.passed).length;
  const totalTests = testResults.length;

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '1000px', 
      margin: '0 auto',
      height: '100vh',
      overflowY: 'auto',
      overflowX: 'hidden',
      boxSizing: 'border-box'
    }}>
      <h2>🧪 Comprehensive Adaptive Feedback System Tests</h2>
      <p style={{ color: '#666', marginBottom: '20px' }}>
        Testing all 6 feedback patterns + goal triggering + edge cases (15 total tests)
      </p>
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={runAllTests} 
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            backgroundColor: isRunning ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? '🔄 Running All 15 Tests...' : '▶️ Run Comprehensive Test Suite'}
        </button>
        
        {testResults.length > 0 && (
          <div style={{ marginLeft: '20px', display: 'inline-block' }}>
            <strong style={{ fontSize: '18px' }}>
              Results: {passedTests}/{totalTests} passed
            </strong>
            <span style={{ 
              color: passedTests === totalTests ? 'green' : passedTests > totalTests * 0.8 ? 'orange' : 'red',
              marginLeft: '10px',
              fontSize: '16px',
              fontWeight: 'bold'
            }}>
              {passedTests === totalTests ? '✅ Perfect! All Patterns Working!' : 
               passedTests > totalTests * 0.8 ? '⚠️ Mostly Good - Minor Issues' : 
               passedTests > totalTests * 0.5 ? '🔧 Several Issues Found' :
               '❌ Major Problems - Needs Attention'}
            </span>
            <div style={{ fontSize: '14px', color: '#666', marginTop: '5px' }}>
              Coverage: High Performance, Struggling, Improvement, Mixed, Confidence, Generic + Goal Triggering
            </div>
          </div>
        )}
      </div>

      {completedGoals.length > 0 && (
        <div style={{ 
          backgroundColor: '#e8f5e9', 
          padding: '15px', 
          borderRadius: '5px', 
          marginBottom: '20px' 
        }}>
          <h3>🎯 Goals Triggered During Testing:</h3>
          <ul>
            {completedGoals.map((goal, index) => (
              <li key={index} style={{ color: '#2e7d32' }}>✅ {goal}</li>
            ))}
          </ul>
        </div>
      )}

      <div>
        {testResults.map((result, index) => (
          <div key={index} style={{
            border: `2px solid ${result.passed ? 'green' : 'red'}`,
            borderRadius: '5px',
            padding: '15px',
            marginBottom: '15px',
            backgroundColor: result.passed ? '#f8fff8' : '#fff5f5'
          }}>
            <h3 style={{ 
              color: result.passed ? 'green' : 'red',
              margin: '0 0 10px 0' 
            }}>
              {result.passed ? '✅' : '❌'} {result.name}
            </h3>
            
            <div><strong>Expected:</strong> {result.expected}</div>
            <div><strong>Actual:</strong> {result.actual}</div>
            
            {result.details && (
              <details style={{ marginTop: '10px' }}>
                <summary style={{ cursor: 'pointer', color: '#666' }}>
                  📋 Full Details
                </summary>
                <pre style={{ 
                  background: '#f5f5f5', 
                  padding: '10px', 
                  borderRadius: '3px',
                  whiteSpace: 'pre-wrap',
                  fontSize: '12px',
                  marginTop: '5px'
                }}>
                  {result.details}
                </pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {testResults.length > 0 && (
        <div style={{ 
          backgroundColor: '#f0f8ff', 
          padding: '15px', 
          borderRadius: '5px',
          marginTop: '20px'
        }}>
          <h3>🔧 Debug Information</h3>
          <p><strong>User ID:</strong> 1</p>
          <p><strong>Current Progress:</strong> {JSON.stringify(getExerciseProgress(1), null, 2)}</p>
          <p><strong>localStorage Keys:</strong> {Object.keys(localStorage).filter(k => k.includes('exerciseProgress')).join(', ')}</p>
        </div>
      )}
    </div>
  );
}

export default AdaptiveFeedbackTestComponent;