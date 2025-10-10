// 🧪 BROWSER CONSOLE TEST RUNNER
// Copy and paste this entire script into your browser's developer console
// while on your algespace application page

console.log("🧪 ===== ADAPTIVE FEEDBACK SYSTEM TEST =====");

// Step 1: Import the adaptive feedback functions (assuming they're available globally)
// If not available globally, you'll need to run this from within your React app context

async function runAdaptiveFeedbackTests() {
  try {
    // Import the adaptive feedback module
    const { detectPerformancePattern, generateAdaptiveFeedback } = await import('./src/utils/adaptiveFeedback.ts');
    const { getExerciseProgress, updateExerciseProgress } = await import('./src/utils/progressiveGoalTracking.ts');
    
    console.log("✅ Modules imported successfully");
    
    // Test Case 1: High Performance Pattern
    console.log("\n🧪 TEST 1: High Performance Pattern");
    const highPerfData = {
      hints: 0,
      errors: 0,
      method: "substitution", 
      exerciseType: "efficiency",
      completedWithSelfExplanation: false,
      userId: 1,
      postConfidence: 5,
      postSatisfaction: 5,
      postAnxiety: 1,
      updatedSuggestions: ["Master all three methods fluently"]
    };
    
    const pattern1 = detectPerformancePattern(highPerfData);
    const feedback1 = generateAdaptiveFeedback(highPerfData);
    
    console.log(`Pattern: ${pattern1.pattern} (confidence: ${pattern1.confidence})`);
    console.log(`Feedback: ${feedback1}`);
    console.log(`✅ Expected: high_performance pattern with perfect score message`);
    
    // Test Case 2: Struggling Pattern  
    console.log("\n🧪 TEST 2: Struggling Pattern");
    const strugglingData = {
      hints: 5,
      errors: 4,
      method: "equalization",
      exerciseType: "matching", 
      completedWithSelfExplanation: false,
      userId: 1,
      postConfidence: 1,
      postSatisfaction: 2,
      postAnxiety: 5,
      updatedSuggestions: ["Build confidence through success", "Learn what linear equations are"]
    };
    
    const pattern2 = detectPerformancePattern(strugglingData);
    const feedback2 = generateAdaptiveFeedback(strugglingData);
    
    console.log(`Pattern: ${pattern2.pattern} (confidence: ${pattern2.confidence})`);
    console.log(`Feedback: ${feedback2}`);
    console.log(`✅ Expected: struggling pattern with anxiety-aware message`);
    
    // Test Case 3: Your Specific Case (6 substitution completions)
    console.log("\n🧪 TEST 3: Your Substitution Mastery Case");
    
    // Mock your current progress
    localStorage.setItem('exerciseProgress_1', JSON.stringify({
      substitution: 6,
      elimination: 0, 
      equalization: 0,
      total: 6,
      errorHistory: [2, 1, 0, 1, 0, 1],
      selfExplanations: 1,
      suitability: 2,
      efficiency: 2,
      matching: 2
    }));
    
    const yourSessionData = {
      hints: 1,
      errors: 0,
      method: "substitution",
      exerciseType: "efficiency",
      completedWithSelfExplanation: false,
      userId: 1,
      postConfidence: 4,
      postSatisfaction: 4,
      updatedSuggestions: ["Master substitution/equalization/elimination method", "Show exceptional problem-solving"]
    };
    
    const yourPattern = detectPerformancePattern(yourSessionData);
    const yourFeedback = generateAdaptiveFeedback(yourSessionData);
    
    console.log(`Pattern: ${yourPattern.pattern} (confidence: ${yourPattern.confidence})`);
    console.log(`Feedback: ${yourFeedback}`);
    console.log(`✅ Expected: high_performance or building_confidence with goal update message`);
    
    console.log("\n🎉 All tests completed! Check the results above.");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
    console.log("💡 Try running this from within your React app context or when the modules are loaded");
  }
}

// Run the tests
runAdaptiveFeedbackTests();

// Alternative: Manual pattern testing without imports
console.log("\n🔧 ===== MANUAL PATTERN LOGIC TEST =====");

function testPatternLogicManually() {
  // Test the actual logic conditions
  const testCases = [
    {
      name: "Perfect Performance",
      hints: 0, errors: 0, 
      postConfidence: 5, postSatisfaction: 5,
      expected: "high_performance"
    },
    {
      name: "High Struggles", 
      hints: 5, errors: 4,
      postConfidence: 1, postAnxiety: 5,
      expected: "struggling"
    },
    {
      name: "Mixed Performance",
      hints: 2, errors: 1,
      postSatisfaction: 2, postAnxiety: 4,
      expected: "mixed_performance" 
    },
    {
      name: "Your Case",
      hints: 1, errors: 0,
      postConfidence: 4, postSatisfaction: 4,
      expected: "high_performance or building_confidence"
    }
  ];
  
  testCases.forEach(test => {
    console.log(`\n🧪 Testing: ${test.name}`);
    console.log(`  Input: hints=${test.hints}, errors=${test.errors}`);
    console.log(`  Reflection: conf=${test.postConfidence}, sat=${test.postSatisfaction}, anx=${test.postAnxiety}`);
    
    // Apply the actual logic from detectPerformancePattern
    let detectedPattern = "generic";
    
    // Struggling check (highest priority)
    if (test.hints >= 3 || test.errors >= 3) {
      const lowConf = test.postConfidence !== undefined ? test.postConfidence <= 2 : false;
      const lowSat = test.postSatisfaction !== undefined ? test.postSatisfaction <= 2 : false; 
      const highAnx = test.postAnxiety !== undefined ? test.postAnxiety >= 4 : false;
      
      if ((lowConf || lowSat || highAnx) && (test.hints >= 4 || test.errors >= 4)) {
        detectedPattern = "struggling (high confidence)";
      } else if (test.hints >= 3 || test.errors >= 3) {
        detectedPattern = "struggling (medium confidence)";
      }
    }
    
    // High performance check
    if (detectedPattern === "generic" && test.hints <= 1 && test.errors <= 1) {
      const hasReflection = test.postConfidence !== undefined && test.postSatisfaction !== undefined;
      
      if (hasReflection && test.postConfidence >= 4 && test.postSatisfaction >= 4) {
        detectedPattern = "high_performance (high confidence)";
      } else if (test.hints === 0 && test.errors === 0) {
        detectedPattern = "high_performance (perfect score)";
      } else if (hasReflection && (test.postConfidence >= 4 || test.postSatisfaction >= 4)) {
        detectedPattern = "high_performance (good reflection)";
      }
    }
    
    // Mixed performance check
    if (detectedPattern === "generic" && test.hints <= 2 && test.errors <= 2) {
      const lowSat = test.postSatisfaction !== undefined ? test.postSatisfaction <= 2 : false;
      const highAnx = test.postAnxiety !== undefined ? test.postAnxiety >= 4 : false;
      
      if (lowSat || highAnx) {
        detectedPattern = "mixed_performance";
      }
    }
    
    // Building confidence check
    if (detectedPattern === "generic" && test.hints <= 2 && test.errors <= 2) {
      const goodConf = test.postConfidence !== undefined ? test.postConfidence >= 3 : true;
      if (goodConf) {
        detectedPattern = "building_confidence";
      }
    }
    
    console.log(`  🎯 Detected: ${detectedPattern}`);
    console.log(`  ✅ Expected: ${test.expected}`);
    console.log(`  ${detectedPattern.includes(test.expected.split(' ')[0]) ? '✅ MATCH' : '❌ MISMATCH'}`);
  });
}

testPatternLogicManually();