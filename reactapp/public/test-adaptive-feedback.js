// Manual testing script for adaptive feedback
// Open this in browser console to test specific scenarios

// Test High Performance Pattern
function testHighPerformance() {
  const mockSession = {
    hints: 0,
    errors: 0,
    method: 'substitution',
    exerciseType: 'efficiency',
    completedWithSelfExplanation: true
  };
  
  const mockPostReflection = {
    postSatisfaction: 5,
    postConfidence: 5,
    postAnxiety: 1
  };
  
  // This would trigger high performance adaptive feedback
  console.log('Testing High Performance Pattern:', mockSession);
  
  // Manually dispatch event to test UI
  window.dispatchEvent(new CustomEvent('showAdaptiveFeedback', {
    detail: {
      message: "🚀 Outstanding! Perfect execution with 0 hints and 0 errors! Your confidence is clearly high - you're ready for bigger challenges!"
    }
  }));
}

// Test Struggling Pattern
function testStrugglingUser() {
  const mockSession = {
    hints: 4,
    errors: 3,
    method: 'elimination',
    exerciseType: 'matching',
    completedWithSelfExplanation: false
  };
  
  const mockPostReflection = {
    postSatisfaction: 2,
    postConfidence: 2,
    postAnxiety: 5
  };
  
  console.log('Testing Struggling User Pattern:', mockSession);
  
  window.dispatchEvent(new CustomEvent('showAdaptiveFeedback', {
    detail: {
      message: "💪 I see you're feeling anxious, but you persisted through 3 errors and 4 hints - that takes real courage! Consider starting with 'Build confidence through success' to build your confidence back up"
    }
  }));
}

// Test Improvement Pattern
function testImprovement() {
  console.log('Testing Improvement Pattern - Complete multiple exercises with decreasing errors');
  
  window.dispatchEvent(new CustomEvent('showAdaptiveFeedback', {
    detail: {
      message: "📈 Amazing progress! Your error rate improved by 40% from 2.5 to 1.5 - you're clearly learning and growing!"
    }
  }));
}

// Make functions available globally
window.testHighPerformance = testHighPerformance;
window.testStrugglingUser = testStrugglingUser;
window.testImprovement = testImprovement;

console.log('🧪 Adaptive Feedback Testing Tools Loaded!');
console.log('Available functions:');
console.log('- testHighPerformance()');
console.log('- testStrugglingUser()');
console.log('- testImprovement()');