import { useState, useRef, useEffect } from 'react';
import { createGoal, completeGoalWithScore, updateGoalSuggestions, getRecommendationReasons, getUserPerformanceStats, fetchGoals, deleteGoal } from '../../utils/api';
import { Goal, GoalInput } from '../../types/goal';

interface TestResult {
  name: string;
  passed: boolean;
  expected: string;
  actual: string;
  details?: string;
  error?: string;
}

interface TestScenario {
  name: string;
  description: string;
  completedGoals: Array<{
    title: string;
    category: string;
    difficulty: string;
    actualScore: number; // error count
    hintsUsed: number;
    postSatisfaction: number;
    postConfidence: number;
    postEffort: number;
    postAnxiety: number; // NEW: anxiety metric
    postEnjoyment: number;
  }>;
  expectedRecommendations: {
    shouldIncludeCategories: string[];
    shouldPrioritize: string; // Which performance issue should be prioritized
  };
}

export function RecommendationSystemTest() {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentScenario, setCurrentScenario] = useState<string>('');
  const [testUserId] = useState(9999); // Dedicated test user ID
  const [showScrollTop, setShowScrollTop] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Test scenarios covering all recommendation cases
  const testScenarios: TestScenario[] = [
    {
      name: "New User (Zero Goals)",
      description: "Tests recommendations for brand new users with no completed goals",
      completedGoals: [],
      expectedRecommendations: {
        shouldIncludeCategories: ["Basic Understanding", "Learning & Growth"],
        shouldPrioritize: "Beginner-friendly goals"
      }
    },
    {
      name: "🆕 HIGH PRIORITY: High Anxiety + Low Confidence",
      description: "User with high anxiety (4.2/5) AND low confidence (2.3/5) - HIGHEST PRIORITY, should get confidence-building goals FIRST",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 2, // moderate errors
          hintsUsed: 2,
          postSatisfaction: 3,
          postConfidence: 2, // LOW confidence
          postEffort: 4,
          postAnxiety: 4, // HIGH anxiety
          postEnjoyment: 2
        },
        {
          title: "Understand how substitution works",
          category: "Basic Understanding",
          difficulty: "easy",
          actualScore: 3, // some errors
          hintsUsed: 3,
          postSatisfaction: 2,
          postConfidence: 2, // LOW confidence
          postEffort: 4,
          postAnxiety: 5, // HIGH anxiety
          postEnjoyment: 2
        },
        {
          title: "Master substitution method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 2,
          hintsUsed: 2,
          postSatisfaction: 3,
          postConfidence: 3, // borderline
          postEffort: 3,
          postAnxiety: 4, // HIGH anxiety
          postEnjoyment: 3
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Learning & Growth"],
        shouldPrioritize: "Confidence-building and anxiety reduction (HIGHEST PRIORITY)"
      }
    },
    {
      name: "High Anxiety + Good Performance",
      description: "User with high anxiety (3.8/5) but good performance - needs reassurance",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 0, // excellent
          hintsUsed: 0,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 3,
          postAnxiety: 4, // HIGH anxiety despite good performance
          postEnjoyment: 4
        },
        {
          title: "Understand how substitution works",
          category: "Basic Understanding",
          difficulty: "easy",
          actualScore: 1, // good
          hintsUsed: 1,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 3,
          postAnxiety: 4, // HIGH anxiety
          postEnjoyment: 4
        },
        {
          title: "Master substitution method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 1,
          hintsUsed: 0,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 3,
          postAnxiety: 3, // moderate anxiety
          postEnjoyment: 4
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Learning & Growth", "Method Mastery"],
        shouldPrioritize: "Reflection goals to recognize actual capabilities"
      }
    },
    {
      name: "High Errors Only",
      description: "User making many errors (avg 4 errors/goal) - should prioritize accuracy",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 5, // 5 errors
          hintsUsed: 1,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 3
        },
        {
          title: "Understand how substitution works",
          category: "Basic Understanding",
          difficulty: "easy",
          actualScore: 4, // 4 errors
          hintsUsed: 2,
          postSatisfaction: 3,
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 3
        },
        {
          title: "Master substitution method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 3, // 3 errors
          hintsUsed: 1,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 4
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Problem Solving", "Basic Understanding"],
        shouldPrioritize: "Accuracy and error reduction"
      }
    },
    {
      name: "High Hints Only",
      description: "User using many hints (avg 4 hints/goal) - should prioritize independence",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 1, // 1 error
          hintsUsed: 5,
          postSatisfaction: 4,
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 4
        },
        {
          title: "Understand how substitution works",
          category: "Basic Understanding",
          difficulty: "easy",
          actualScore: 0, // 0 errors
          hintsUsed: 4,
          postSatisfaction: 4,
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 4
        },
        {
          title: "Master substitution method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 1, // 1 error
          hintsUsed: 3,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 4
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Problem Solving", "Method Mastery"],
        shouldPrioritize: "Independence and hint-free goals"
      }
    },
    {
      name: "🆕 High Anxiety + Low Confidence + High Errors (Triple Conflict)",
      description: "User struggling with anxiety (4/5), confidence (2/5) AND errors (avg 4) - anxiety+confidence should win",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 5, // high errors
          hintsUsed: 2,
          postSatisfaction: 2,
          postConfidence: 2, // LOW
          postEffort: 4,
          postAnxiety: 4, // HIGH
          postEnjoyment: 2
        },
        {
          title: "Understand how substitution works",
          category: "Basic Understanding",
          difficulty: "easy",
          actualScore: 4, // high errors
          hintsUsed: 3,
          postSatisfaction: 2,
          postConfidence: 2, // LOW
          postEffort: 4,
          postAnxiety: 4, // HIGH
          postEnjoyment: 2
        },
        {
          title: "Master substitution method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 3, // high errors
          hintsUsed: 2,
          postSatisfaction: 2,
          postConfidence: 2, // LOW
          postEffort: 4,
          postAnxiety: 4, // HIGH
          postEnjoyment: 2
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Learning & Growth"],
        shouldPrioritize: "Anxiety + Confidence FIRST (emotional barrier), then errors"
      }
    },
    {
      name: "High Errors + High Hints (Conflict)",
      description: "User struggling with both errors (avg 4) and hints (avg 4) - should prioritize ERRORS first",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 5, // 5 errors
          hintsUsed: 5, // 5 hints
          postSatisfaction: 3,
          postConfidence: 3,
          postEffort: 4,
          postAnxiety: 2,
          postEnjoyment: 3
        },
        {
          title: "Understand how substitution works",
          category: "Basic Understanding",
          difficulty: "easy",
          actualScore: 4, // 4 errors
          hintsUsed: 4, // 4 hints
          postSatisfaction: 3,
          postConfidence: 3,
          postEffort: 4,
          postAnxiety: 2,
          postEnjoyment: 3
        },
        {
          title: "Master substitution method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 3, // 3 errors
          hintsUsed: 3, // 3 hints
          postSatisfaction: 3,
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 3
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Problem Solving", "Basic Understanding"],
        shouldPrioritize: "ERRORS over hints (accuracy-focused goals)"
      }
    },
    {
      name: "High Errors + Low Satisfaction (Conflict)",
      description: "User with errors (avg 4) AND low satisfaction (avg 2) - should prioritize ERRORS first",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 5, // 5 errors
          hintsUsed: 1,
          postSatisfaction: 2, // low satisfaction
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 2
        },
        {
          title: "Understand how substitution works",
          category: "Basic Understanding",
          difficulty: "easy",
          actualScore: 4, // 4 errors
          hintsUsed: 1,
          postSatisfaction: 2, // low satisfaction
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 2
        },
        {
          title: "Master substitution method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 3, // 3 errors
          hintsUsed: 2,
          postSatisfaction: 2, // low satisfaction
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 2
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Problem Solving", "Learning & Growth"],
        shouldPrioritize: "ERRORS first, then motivation (but both addressed)"
      }
    },
    {
      name: "Low Satisfaction Only",
      description: "Good performance but low satisfaction (avg 2) - should prioritize confidence/motivation",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 0, // 0 errors
          hintsUsed: 1,
          postSatisfaction: 2, // low satisfaction
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 2
        },
        {
          title: "Understand how substitution works",
          category: "Basic Understanding",
          difficulty: "easy",
          actualScore: 1, // 1 error
          hintsUsed: 0,
          postSatisfaction: 2, // low satisfaction
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 2
        },
        {
          title: "Master substitution method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 0, // 0 errors
          hintsUsed: 1,
          postSatisfaction: 2, // low satisfaction
          postConfidence: 3,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 3
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Learning & Growth"],
        shouldPrioritize: "Confidence and motivation building"
      }
    },
    {
      name: "🆕 Low Effort + High Performance",
      description: "Good performance but low effort (avg 2.3) - may need challenge or engagement",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 0,
          hintsUsed: 0,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 2, // low effort
          postAnxiety: 2,
          postEnjoyment: 3
        },
        {
          title: "Understand how substitution works",
          category: "Basic Understanding",
          difficulty: "easy",
          actualScore: 1,
          hintsUsed: 0,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 2, // low effort
          postAnxiety: 2,
          postEnjoyment: 3
        },
        {
          title: "Master substitution method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 0,
          hintsUsed: 1,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 3, // moderate effort
          postAnxiety: 2,
          postEnjoyment: 4
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Learning & Growth", "Problem Solving"],
        shouldPrioritize: "Challenge and engagement (resilience goals)"
      }
    },
    {
      name: "Good Performance (Category Progression)",
      description: "Strong performance across all metrics - should follow normal category progression",
      completedGoals: [
        {
          title: "Learn what linear equations are",
          category: "Basic Understanding",
          difficulty: "very easy",
          actualScore: 0, // 0 errors
          hintsUsed: 0,
          postSatisfaction: 5,
          postConfidence: 5,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 5
        },
        {
          title: "Master substitution/equalization/elimination method",
          category: "Method Mastery",
          difficulty: "easy",
          actualScore: 1, // 1 error (acceptable)
          hintsUsed: 0,
          postSatisfaction: 4,
          postConfidence: 4,
          postEffort: 3,
          postAnxiety: 2,
          postEnjoyment: 4
        }
      ],
      expectedRecommendations: {
        shouldIncludeCategories: ["Basic Understanding", "Method Mastery", "Problem Solving", "Learning & Growth"],
        shouldPrioritize: "Natural progression (next level in each category)"
      }
    }
  ];

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: TestResult[] = [];

    console.log('🧪 Starting Recommendation System Tests...');
    console.log(`🧪 Test User ID: ${testUserId}`);
    
    // Clear old test data first
    console.log('🧹 Clearing old test data...');
    try {
      const existingGoals = await fetchGoals(testUserId);
      console.log(`🧹 Found ${existingGoals.length} existing test goals to delete`);
      for (const goal of existingGoals) {
        await deleteGoal(goal.id);
      }
      console.log('✅ Test data cleared successfully');
    } catch (error) {
      console.error('⚠️ Failed to clear old test data:', error);
    }

    for (const scenario of testScenarios) {
      setCurrentScenario(scenario.name);
      console.log(`\n🧪 Testing Scenario: ${scenario.name}`);
      console.log(`📋 Description: ${scenario.description}`);

      // Clean up before EACH test scenario to prevent data accumulation
      try {
        const existingGoals = await fetchGoals(testUserId);
        if (existingGoals.length > 0) {
          console.log(`🧹 Clearing ${existingGoals.length} goals before this test...`);
          for (const goal of existingGoals) {
            await deleteGoal(goal.id);
          }
        }
      } catch (error) {
        console.error('⚠️ Failed to clear goals before test:', error);
      }

      try {
        // Step 1: Create and complete goals for this scenario
        const createdGoals: Goal[] = [];
        
        for (const goalData of scenario.completedGoals) {
          try {
            // Create goal
            const goalInput: GoalInput = {
              title: goalData.title,
              category: goalData.category,
              difficulty: goalData.difficulty,
              userId: testUserId
            };
            
            const createdGoal = await createGoal(goalInput);
            createdGoals.push(createdGoal);
            
            // Complete goal with performance data
            await completeGoalWithScore(
              createdGoal.id,
              goalData.actualScore, // actualScore (error count)
              goalData.hintsUsed, // hintsUsed
              goalData.actualScore, // errorsMade (same as actualScore)
              goalData.postSatisfaction,
              goalData.postConfidence,
              goalData.postEffort,
              goalData.postEnjoyment,
              goalData.postAnxiety
            );
            
            console.log(`✅ Created and completed: "${goalData.title}" (Errors: ${goalData.actualScore}, Hints: ${goalData.hintsUsed}, Anxiety: ${goalData.postAnxiety}, Confidence: ${goalData.postConfidence})`);
            
          } catch (error) {
            console.error(`❌ Failed to create/complete goal: "${goalData.title}"`, error);
            results.push({
              name: `❌ ${scenario.name} - Setup Failed`,
              passed: false,
              expected: `Goals created and completed`,
              actual: `Error creating goal: ${error}`,
              error: String(error)
            });
            continue;
          }
        }

        // Step 2: Get performance stats
        const statsResult = await getUserPerformanceStats(testUserId);
        const stats = statsResult.stats;
        
        console.log('📊 Performance Stats:', {
          totalGoals: stats.totalGoalsCompleted,
          avgErrors: stats.averageErrorsPerGoal,
          avgHints: stats.averageHintsPerGoal,
          avgSatisfaction: stats.averageSatisfaction,
          avgConfidence: stats.averageConfidence,
          avgAnxiety: stats.averageAnxiety,
          avgEffort: stats.averageEffort
        });

        // Step 3: Trigger recommendation update
        const suggestions = await updateGoalSuggestions(testUserId);
        
        console.log(`💡 Received ${suggestions.length} recommendations:`, suggestions);

        // Step 4: Verify recommendations match expected patterns
        const suggestionsText = suggestions.join(' | ');
        
        // Check if expected categories are present
        const categoriesPresent = scenario.expectedRecommendations.shouldIncludeCategories.filter(
          category => suggestionsText.includes(category)
        );
        
        const allCategoriesPresent = categoriesPresent.length === scenario.expectedRecommendations.shouldIncludeCategories.length;

        // Step 5: Get recommendation reasons
        let reasons: Record<string, string> = {};
        if (suggestions.length > 0) {
          reasons = await getRecommendationReasons(testUserId, suggestions);
          console.log('💬 Recommendation Reasons:', Object.keys(reasons));
        }

        // Analyze if priority is correct based on scenario
        let priorityCorrect = true;
        let priorityDetails = '';
        
        if (scenario.name.includes("HIGH PRIORITY: High Anxiety + Low Confidence")) {
          // Should prioritize confidence-building (Learning & Growth)
          const hasConfidenceGoals = suggestionsText.includes("confidence") || suggestionsText.includes("Learning & Growth");
          priorityCorrect = hasConfidenceGoals;
          priorityDetails = hasConfidenceGoals ? 
            "✅ CORRECT: Prioritizes confidence-building for high anxiety + low confidence (HIGHEST PRIORITY)" :
            "❌ FAILED: Should prioritize confidence-building when anxiety is high AND confidence is low";
        } else if (scenario.name.includes("High Anxiety + Good Performance")) {
          // Should have reflection goals
          const hasReflectionGoals = suggestionsText.includes("Reflect") || suggestionsText.includes("effectiveness");
          priorityCorrect = hasReflectionGoals;
          priorityDetails = hasReflectionGoals ?
            "✅ CORRECT: Suggests reflection to help recognize actual capabilities" :
            "❌ FAILED: Should suggest reflection goals for unnecessary anxiety";
        } else if (scenario.name.includes("Triple Conflict")) {
          // Anxiety + Confidence should win over errors
          const hasConfidenceGoals = suggestionsText.includes("confidence") || suggestionsText.includes("Learning & Growth");
          const hasErrorGoals = suggestionsText.includes("minimal errors") || suggestionsText.includes("accuracy");
          priorityCorrect = hasConfidenceGoals && !hasErrorGoals;
          priorityDetails = hasConfidenceGoals ?
            `✅ CORRECT: Anxiety + Confidence takes priority over errors (emotional barrier first) ${hasErrorGoals ? '[⚠️ Also includes error goals]' : ''}` :
            "❌ FAILED: Anxiety + Confidence should take HIGHEST priority over errors";
        } else if (scenario.name.includes("High Errors + High Hints")) {
          // Should prioritize accuracy (Problem Solving with "minimal errors")
          const hasAccuracyGoal = suggestionsText.includes("minimal errors") || suggestionsText.includes("accuracy");
          priorityCorrect = hasAccuracyGoal;
          priorityDetails = hasAccuracyGoal ? 
            "✅ CORRECT: Prioritizes ERRORS (accuracy goals present)" :
            "❌ FAILED: Should prioritize accuracy goals when both errors and hints are high";
        } else if (scenario.name.includes("High Errors + Low Satisfaction")) {
          // Should have both error-focused and motivation goals
          const hasErrorGoals = suggestionsText.includes("minimal errors") || suggestionsText.includes("Basic Understanding");
          const hasMotivationGoals = suggestionsText.includes("confidence") || suggestionsText.includes("Learning & Growth");
          priorityCorrect = hasErrorGoals; // Errors should be primary
          priorityDetails = hasErrorGoals ?
            `✅ CORRECT: Prioritizes ERRORS first ${hasMotivationGoals ? '(also includes motivation)' : ''}` :
            "❌ FAILED: Should prioritize error reduction when errors are high";
        } else if (scenario.name.includes("Low Effort")) {
          // Should have challenge/resilience goals
          const hasChallengeGoals = suggestionsText.includes("resilience") || suggestionsText.includes("Problem Solving");
          priorityCorrect = hasChallengeGoals;
          priorityDetails = hasChallengeGoals ?
            "✅ CORRECT: Includes challenge/engagement goals for low effort" :
            "❌ FAILED: Should suggest more challenging goals when effort is low";
        }

        results.push({
          name: `🎯 ${scenario.name}`,
          passed: allCategoriesPresent && priorityCorrect,
          expected: `Categories: [${scenario.expectedRecommendations.shouldIncludeCategories.join(', ')}]\nPriority: ${scenario.expectedRecommendations.shouldPrioritize}`,
          actual: `Categories Found: [${categoriesPresent.join(', ')}]\nSuggestions: ${suggestions.slice(0, 3).map((s: string) => s.split('|')[1]).join(', ')}`,
          details: `📊 Performance:\n  - Avg Errors: ${stats.averageErrorsPerGoal?.toFixed(1) || 'N/A'}\n  - Avg Hints: ${stats.averageHintsPerGoal?.toFixed(1) || 'N/A'}\n  - Avg Confidence: ${stats.averageConfidence?.toFixed(1) || 'N/A'}/5\n  - Avg Anxiety: ${stats.averageAnxiety?.toFixed(1) || 'N/A'}/5\n  - Avg Satisfaction: ${stats.averageSatisfaction?.toFixed(1) || 'N/A'}/5\n  - Avg Effort: ${stats.averageEffort?.toFixed(1) || 'N/A'}/5\n\n💡 Recommendations:\n${suggestions.slice(0, 4).map((s: string, i: number) => {
            const parts = s.split('|');
            const title = parts[1] || s;
            const reason = reasons[title];
            return `  ${i + 1}. "${title}"\n     ${reason ? `Reason: ${reason.split('\n')[0]}` : 'No reason available'}`;
          }).join('\n\n')}\n\n${priorityDetails}\n\n${allCategoriesPresent ? '✅' : '❌'} Expected categories: ${allCategoriesPresent ? 'All present' : `Missing: ${scenario.expectedRecommendations.shouldIncludeCategories.filter(c => !categoriesPresent.includes(c)).join(', ')}`}`
        });

      } catch (error) {
        results.push({
          name: `❌ ${scenario.name} - Test Failed`,
          passed: false,
          expected: 'Recommendations generated successfully',
          actual: `Error: ${error}`,
          error: String(error),
          details: `❌ Test scenario failed to execute\n❌ Check backend connectivity\n❌ Error: ${error}`
        });
      }
    }

    setTestResults(results);
    setIsRunning(false);
    setCurrentScenario('');
    console.log('🧪 All recommendation tests completed!');
  };

  const clearTestData = () => {
    console.log('🧹 Test data cleanup would go here (manual for now)');
    alert('Please manually delete test goals for user ID ' + testUserId + ' from the database');
  };

  const scrollToTop = () => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle scroll event to show/hide scroll to top button
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      setShowScrollTop(container.scrollTop > 300);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      ref={containerRef}
      style={{ 
        padding: '2rem', 
        fontFamily: 'Arial, sans-serif', 
        maxWidth: '1200px', 
        margin: '0 auto',
        maxHeight: 'calc(100vh - 200px)',
        overflowY: 'auto',
        overflowX: 'hidden',
        position: 'relative',
        scrollBehavior: 'smooth'
      }}>
      <h1 style={{ color: '#1976d2', marginBottom: '1rem' }}>
        🧪 Recommendation System Test Suite
      </h1>
      
      <div style={{ 
        backgroundColor: '#e3f2fd', 
        padding: '1rem', 
        borderRadius: '8px', 
        marginBottom: '1.5rem',
        border: '2px solid #2196f3'
      }}>
        <h3 style={{ margin: '0 0 0.5rem 0', color: '#1565c0' }}>Test Coverage (11 Scenarios):</h3>
        <ul style={{ margin: 0, paddingLeft: '1.5rem', color: '#424242' }}>
          <li><strong>New User Scenario</strong> - Zero goals completed</li>
          <li><strong>🆕 High Anxiety + Low Confidence (HIGHEST PRIORITY)</strong> - Avg anxiety 4.2/5, confidence 2.3/5</li>
          <li><strong>🆕 High Anxiety + Good Performance</strong> - Unnecessary worry despite success</li>
          <li><strong>High Errors</strong> - Avg 4 errors/goal (should prioritize accuracy)</li>
          <li><strong>High Hints</strong> - Avg 4 hints/goal (should prioritize independence)</li>
          <li><strong>🆕 Triple Conflict (Anxiety + Confidence + Errors)</strong> - Emotional barrier wins</li>
          <li><strong>Conflict Cases:</strong>
            <ul>
              <li>High Errors + High Hints → Priority: <strong>ERRORS</strong></li>
              <li>High Errors + Low Satisfaction → Priority: <strong>ERRORS</strong></li>
            </ul>
          </li>
          <li><strong>Low Satisfaction</strong> - Good performance but low motivation</li>
          <li><strong>🆕 Low Effort + High Performance</strong> - May need challenge</li>
          <li><strong>Good Performance</strong> - Normal category progression</li>
        </ul>
        <p style={{ marginTop: '0.5rem', marginBottom: 0, fontSize: '0.9rem', fontStyle: 'italic' }}>
          Test User ID: <strong>{testUserId}</strong> | <strong>🆕 Enhanced with Anxiety & Effort metrics</strong>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
        <button
          onClick={runAllTests}
          disabled={isRunning}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: isRunning ? '#ccc' : '#4caf50',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isRunning ? `⏳ Running: ${currentScenario}...` : '▶️ Run All Tests'}
        </button>

        <button
          onClick={clearTestData}
          disabled={isRunning}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#ff9800',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '1rem',
            cursor: isRunning ? 'not-allowed' : 'pointer'
          }}
        >
          🧹 Clear Test Data
        </button>
      </div>

      {testResults.length > 0 && (
        <div style={{ 
          maxHeight: 'calc(100vh - 500px)', 
          overflowY: 'auto',
          paddingRight: '0.5rem'
        }}>
          <h2 style={{ color: '#424242', marginBottom: '1rem', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 10, paddingBottom: '0.5rem' }}>
            📊 Test Results: {testResults.filter(r => r.passed).length}/{testResults.length} Passed
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {testResults.map((result, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: result.passed ? '#e8f5e9' : '#ffebee',
                  border: `2px solid ${result.passed ? '#4caf50' : '#f44336'}`,
                  borderRadius: '8px',
                  padding: '1rem'
                }}
              >
                <h3 style={{ 
                  margin: '0 0 0.5rem 0', 
                  color: result.passed ? '#2e7d32' : '#c62828',
                  fontSize: '1.1rem'
                }}>
                  {result.name}
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '0.5rem' }}>
                  <div>
                    <strong style={{ color: '#666' }}>Expected:</strong>
                    <pre style={{ 
                      margin: '0.25rem 0 0 0', 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.85rem',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '0.5rem',
                      borderRadius: '4px'
                    }}>
                      {result.expected}
                    </pre>
                  </div>
                  <div>
                    <strong style={{ color: '#666' }}>Actual:</strong>
                    <pre style={{ 
                      margin: '0.25rem 0 0 0', 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.85rem',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '0.5rem',
                      borderRadius: '4px'
                    }}>
                      {result.actual}
                    </pre>
                  </div>
                </div>

                {result.details && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong style={{ color: '#666' }}>Details:</strong>
                    <pre style={{ 
                      margin: '0.25rem 0 0 0', 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.85rem',
                      backgroundColor: 'rgba(255,255,255,0.7)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      color: '#424242'
                    }}>
                      {result.details}
                    </pre>
                  </div>
                )}

                {result.error && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <strong style={{ color: '#c62828' }}>Error:</strong>
                    <pre style={{ 
                      margin: '0.25rem 0 0 0', 
                      whiteSpace: 'pre-wrap', 
                      fontSize: '0.85rem',
                      backgroundColor: 'rgba(0,0,0,0.05)',
                      padding: '0.5rem',
                      borderRadius: '4px',
                      color: '#c62828'
                    }}>
                      {result.error}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {testResults.length === 0 && !isRunning && (
        <div style={{
          backgroundColor: '#f5f5f5',
          padding: '2rem',
          borderRadius: '8px',
          textAlign: 'center',
          color: '#666'
        }}>
          <p style={{ fontSize: '1.1rem', margin: 0 }}>
            Click "Run All Tests" to start testing the recommendation system with various performance scenarios.
          </p>
        </div>
      )}

      {/* Scroll to Top Button */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: '50px',
            height: '50px',
            borderRadius: '50%',
            backgroundColor: '#2196f3',
            color: 'white',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
            zIndex: 1000,
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#1976d2';
            e.currentTarget.style.transform = 'scale(1.1)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#2196f3';
            e.currentTarget.style.transform = 'scale(1)';
          }}
          title="Scroll to top"
        >
          ↑
        </button>
      )}
    </div>
  );
}
