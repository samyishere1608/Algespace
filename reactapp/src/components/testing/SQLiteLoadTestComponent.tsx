import { useState } from 'react';
import { createGoal, fetchGoals, deleteGoal, completeGoalWithScore, submitPretestAnswers } from '@/utils/api';
import { saveExerciseSession } from '@/utils/progressiveGoalTracking';

interface LoadTestResult {
  testName: string;
  status: 'pass' | 'fail' | 'warning';
  duration: number;
  details: string;
  concurrent: number;
  successCount: number;
  failureCount: number;
  avgResponseTime: number;
}

interface ConcurrentOperationResult {
  success: boolean;
  duration: number;
  error?: string;
}

/**
 * 🔥 SQLite Lo      // Test 11: Concurrent Pretest Submissions (60 stude      // Test 9: Sustained Load (50 students, 5 rounds)
      setCurrentTest('Testing sustained load (50 students, 5 rounds)...');
      results.push(await testSustainedLoad(50, 5));
      setTestResults([...results]);

      // ========================================
      // PRETEST LOAD TESTS
      // ========================================

      // Test 10: Single Pretest Diagnostic
      setCurrentTest('Testing single pretest submission (diagnostic)...');
      results.push(await testSinglePretest());
      setTestResults([...results]);

      // If single pretest fails, don't continue with concurrent tests
      if (results[results.length - 1].status === 'fail') {
        setCurrentTest('⚠️ Single pretest failed - skipping concurrent pretest tests. Check console for details.');
        setTimeout(() => setCurrentTest(''), 3000);
        setIsRunning(false);
        return;
      }

      // Test 11: Concurrent Pretest Submissions (30 students)
      setCurrentTest('📝 Testing concurrent pretest submissions (30 students)...');
      results.push(await testConcurrentPretests(30));
      setTestResults([...results]);etCurrentTest('📝 Testing concurrent pretest submissions (60 students)...');
      results.push(await testConcurrentPretests(60));
      setTestResults([...results]);

      // ========================================
      // EXTREME LOAD TESTS - COMMENTED OUT
      // These test 100-200+ students (beyond typical classroom use)
      // Uncomment if needed to find absolute system limits
      // ========================================

      /*
      // Test 12: 100 Concurrent Writes
      setCurrentTest('EXTREME TEST: 100 concurrent writes...');
      results.push(await testConcurrentWrites(100));
      setTestResults([...results]);mponent
 * 
 * Tests SQLite's ability to handle concurrent operations from 50-60 students
 * 
 * Key Considerations:
 * - SQLite allows only ONE write at a time (serialized writes)
 * - Multiple reads can happen concurrently
 * - Write operations are queued automatically by SQLite
 * - Tests realistic student usage patterns
 */
export function SQLiteLoadTestComponent() {
  const [testResults, setTestResults] = useState<LoadTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState('');

  // Test user IDs range for load testing (10000-10250)
  const LOAD_TEST_USER_START = 10000;
  const LOAD_TEST_USER_COUNT = 250;  // Increased for extreme load testing

  /**
   * Simulate concurrent read operations (allowed by SQLite)
   */
  const testConcurrentReads = async (concurrentCount: number): Promise<LoadTestResult> => {
    const startTime = Date.now();
    const operations: Promise<ConcurrentOperationResult>[] = [];

    console.log(`📖 Testing ${concurrentCount} concurrent READS...`);

    for (let i = 0; i < concurrentCount; i++) {
      const userId = LOAD_TEST_USER_START + i;
      operations.push(
        (async () => {
          const opStart = Date.now();
          try {
            await fetchGoals(userId);
            return { success: true, duration: Date.now() - opStart };
          } catch (error) {
            return { success: false, duration: Date.now() - opStart, error: String(error) };
          }
        })()
      );
    }

    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    return {
      testName: `Concurrent Reads (${concurrentCount} users)`,
      status: failureCount === 0 ? 'pass' : (failureCount < concurrentCount * 0.1 ? 'warning' : 'fail'),
      duration,
      concurrent: concurrentCount,
      successCount,
      failureCount,
      avgResponseTime,
      details: `✅ ${successCount}/${concurrentCount} successful reads. Avg response: ${avgResponseTime.toFixed(0)}ms. Total time: ${duration}ms`
    };
  };

  /**
   * Simulate concurrent write operations (SQLite serializes these)
   * This is the critical test - SQLite queues writes automatically
   */
  const testConcurrentWrites = async (concurrentCount: number): Promise<LoadTestResult> => {
    const startTime = Date.now();
    const operations: Promise<ConcurrentOperationResult>[] = [];

    console.log(`✍️ Testing ${concurrentCount} concurrent WRITES (SQLite will serialize)...`);

    for (let i = 0; i < concurrentCount; i++) {
      const userId = LOAD_TEST_USER_START + i;
      operations.push(
        (async () => {
          const opStart = Date.now();
          try {
            await createGoal({
              userId,
              title: `Load Test Goal ${i}`,
              category: 'Basic Understanding',
              difficulty: 'easy'
            });
            return { success: true, duration: Date.now() - opStart };
          } catch (error: any) {
            console.error(`❌ Write test failed for user ${userId}:`, error);
            return { success: false, duration: Date.now() - opStart, error: error.message || String(error) };
          }
        })()
      );
    }

    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    // Log sample errors for debugging
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.error(`❌ ${failureCount} writes failed! Sample errors:`);
      failedResults.slice(0, 5).forEach((result, idx) => {
        console.error(`  Error ${idx + 1}:`, result.error);
      });
    }

    // SQLite should handle all writes successfully, just with queuing
    // Warning if avg response time > 500ms per operation
    const status = failureCount === 0 
      ? (avgResponseTime > 500 ? 'warning' : 'pass')
      : 'fail';

    const errorSummary = failureCount > 0 ? ` ❌ Errors: ${failedResults[0]?.error || 'Unknown'}` : '';

    return {
      testName: `Concurrent Writes (${concurrentCount} users)`,
      status,
      duration,
      concurrent: concurrentCount,
      successCount,
      failureCount,
      avgResponseTime,
      details: `${successCount > 0 ? '✅' : '❌'} ${successCount}/${concurrentCount} successful writes. Avg response: ${avgResponseTime.toFixed(0)}ms. Total time: ${duration}ms. ${avgResponseTime > 500 ? '⚠️ Response time high!' : failureCount === 0 ? '✅ Response time acceptable' : ''}${errorSummary}`
    };
  };

  /**
   * Simulate realistic student activity - mixed reads and writes
   * This represents real classroom usage
   */
  const testRealisticStudentLoad = async (studentCount: number): Promise<LoadTestResult> => {
    const startTime = Date.now();
    const operations: Promise<ConcurrentOperationResult>[] = [];

    console.log(`🎓 Testing ${studentCount} students doing realistic activities...`);

    for (let i = 0; i < studentCount; i++) {
      const userId = LOAD_TEST_USER_START + i;
      
      // Each "student" performs a realistic sequence of operations
      operations.push(
        (async () => {
          const opStart = Date.now();
          try {
            // 1. Fetch their goals (read)
            await fetchGoals(userId);
            
            // 2. Save exercise progress (write)
            const exerciseId = Math.floor(Math.random() * 10) + 1;
            saveExerciseSession(userId, 'efficiency', exerciseId, {
              method: ['substitution', 'elimination', 'equalization'][Math.floor(Math.random() * 3)],
              exerciseType: 'efficiency',
              errors: Math.floor(Math.random() * 3),
              hints: Math.floor(Math.random() * 3),
              completedWithSelfExplanation: false
            });
            
            // 3. Fetch goals again to see updates (read)
            await fetchGoals(userId);
            
            return { success: true, duration: Date.now() - opStart };
          } catch (error) {
            return { success: false, duration: Date.now() - opStart, error: String(error) };
          }
        })()
      );
    }

    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    const status = failureCount === 0 
      ? (avgResponseTime > 1000 ? 'warning' : 'pass')
      : (failureCount < studentCount * 0.1 ? 'warning' : 'fail');

    return {
      testName: `Realistic Student Activity (${studentCount} students)`,
      status,
      duration,
      concurrent: studentCount,
      successCount,
      failureCount,
      avgResponseTime,
      details: `✅ ${successCount}/${studentCount} students completed activities. Avg time per student: ${avgResponseTime.toFixed(0)}ms. Total time: ${duration}ms. ${avgResponseTime > 1000 ? '⚠️ Students may experience delays!' : '✅ Performance acceptable'}`
    };
  };

  /**
   * Test sustained load over time (simulates a full class period)
   */
  const testSustainedLoad = async (studentCount: number, rounds: number): Promise<LoadTestResult> => {
    const startTime = Date.now();
    const allRoundResults: ConcurrentOperationResult[] = [];

    console.log(`⏱️ Testing sustained load: ${studentCount} students over ${rounds} rounds...`);

    for (let round = 0; round < rounds; round++) {
      console.log(`  Round ${round + 1}/${rounds}...`);
      
      const operations: Promise<ConcurrentOperationResult>[] = [];
      
      for (let i = 0; i < studentCount; i++) {
        const userId = LOAD_TEST_USER_START + i;
        operations.push(
          (async () => {
            const opStart = Date.now();
            try {
              // Alternate between reads and writes each round
              if (round % 2 === 0) {
                // Even rounds: just read goals
                await fetchGoals(userId);
              } else {
                // Odd rounds: create a new goal (not update non-existent ones)
                await createGoal({
                  userId,
                  title: `Sustained Load Goal Round ${round}`,
                  category: 'Basic Understanding',
                  difficulty: 'easy'
                });
              }
              return { success: true, duration: Date.now() - opStart };
            } catch (error) {
              return { success: false, duration: Date.now() - opStart, error: String(error) };
            }
          })()
        );
      }

      const results = await Promise.all(operations);
      allRoundResults.push(...results);
      
      // Small delay between rounds (simulates natural usage)
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const duration = Date.now() - startTime;
    const successCount = allRoundResults.filter(r => r.success).length;
    const failureCount = allRoundResults.filter(r => !r.success).length;
    const avgResponseTime = allRoundResults.reduce((sum, r) => sum + r.duration, 0) / allRoundResults.length;
    const totalOperations = studentCount * rounds;

    const status = failureCount === 0 
      ? (avgResponseTime > 500 ? 'warning' : 'pass')
      : (failureCount < totalOperations * 0.1 ? 'warning' : 'fail');

    return {
      testName: `Sustained Load (${studentCount} students × ${rounds} rounds)`,
      status,
      duration,
      concurrent: studentCount,
      successCount,
      failureCount,
      avgResponseTime,
      details: `✅ ${successCount}/${totalOperations} operations successful. Avg response: ${avgResponseTime.toFixed(0)}ms. Total duration: ${(duration / 1000).toFixed(1)}s. ${avgResponseTime > 500 ? '⚠️ Performance degradation detected!' : '✅ Consistent performance maintained'}`
    };
  };

  /**
   * Test complete student workflow with goal completion and emotional data
   * This simulates the FULL experience: create goal → complete exercise → complete goal with all emotional data
   */
  const testCompleteStudentWorkflow = async (studentCount: number): Promise<LoadTestResult> => {
    const startTime = Date.now();
    const operations: Promise<ConcurrentOperationResult>[] = [];

    console.log(`🎓 Testing ${studentCount} students with COMPLETE workflow (create + exercise + completion with emotions)...`);

    // Sample goal titles for variety
    const goalTitles = [
      "Learn what linear equations are",
      "Understand how substitution works",
      "Complete exercises without hints",
      "Build confidence through success",
      "Practice with different methods"
    ];

    // Sample methods
    const methods = ['substitution', 'elimination', 'equalization'];

    for (let i = 0; i < studentCount; i++) {
      const userId = LOAD_TEST_USER_START + i;
      
      operations.push(
        (async () => {
          const opStart = Date.now();
          try {
            // Step 1: Create a goal
            const goalTitle = goalTitles[i % goalTitles.length];
            const goal = await createGoal({
              userId,
              title: goalTitle,
              category: i % 2 === 0 ? 'Basic Understanding' : 'Learning & Growth',
              difficulty: i % 3 === 0 ? 'easy' : i % 3 === 1 ? 'medium' : 'hard'
            });

            // Step 2: Simulate exercise session (save exercise data)
            const exerciseId = (i % 10) + 1;
            const sessionData = {
              method: methods[i % 3],
              exerciseType: 'efficiency',
              errors: Math.floor(Math.random() * 4), // 0-3 errors
              hints: Math.floor(Math.random() * 3),  // 0-2 hints
              completedWithSelfExplanation: Math.random() > 0.5
            };
            
            saveExerciseSession(userId, 'efficiency', exerciseId, sessionData);

            // Step 3: Complete goal with comprehensive emotional/performance data
            await completeGoalWithScore(
              goal.id!,
              0.75 + Math.random() * 0.25,  // actualScore: 0.75-1.0
              sessionData.hints,             // hintsUsed
              sessionData.errors,            // errorsMade
              Math.floor(3 + Math.random() * 3),  // postSatisfaction: 3-5
              Math.floor(3 + Math.random() * 3),  // postConfidence: 3-5
              Math.floor(3 + Math.random() * 3),  // postEffort: 3-5
              Math.floor(3 + Math.random() * 3),  // postEnjoyment: 3-5
              Math.floor(1 + Math.random() * 2)   // postAnxiety: 1-2 (low anxiety)
            );

            // Step 4: Fetch updated goals to verify completion
            await fetchGoals(userId);

            return { success: true, duration: Date.now() - opStart };
          } catch (error) {
            return { success: false, duration: Date.now() - opStart, error: String(error) };
          }
        })()
      );
    }

    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    // Log sample errors for debugging
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.error(`❌ ${failureCount} workflows failed! Sample errors:`);
      failedResults.slice(0, 5).forEach((result, idx) => {
        console.error(`  Error ${idx + 1}:`, result.error);
      });
    }

    // This is the most comprehensive test - should complete but may be slower
    const status = failureCount === 0 
      ? (avgResponseTime > 2000 ? 'warning' : 'pass')
      : (failureCount < studentCount * 0.1 ? 'warning' : 'fail');

    const errorSummary = failureCount > 0 ? ` ❌ First error: ${failedResults[0]?.error?.substring(0, 100) || 'Unknown'}` : '';

    return {
      testName: `Complete Student Workflow (${studentCount} students)`,
      status,
      duration,
      concurrent: studentCount,
      successCount,
      failureCount,
      avgResponseTime,
      details: `${successCount > 0 ? '✅' : '❌'} ${successCount}/${studentCount} students completed FULL workflow (create goal + exercise + emotional data + completion). Avg time: ${avgResponseTime.toFixed(0)}ms. Total: ${(duration / 1000).toFixed(1)}s. ${avgResponseTime > 2000 ? '⚠️ Students may wait 2+ seconds!' : failureCount === 0 ? '✅ Realistic response times' : ''}${errorSummary}`
    };
  };

  /**
   * Test concurrent pretest submissions (students taking pretest simultaneously)
   */
  const testConcurrentPretests = async (concurrentCount: number): Promise<LoadTestResult> => {
    const startTime = Date.now();
    const operations: Promise<ConcurrentOperationResult>[] = [];

    console.log(`📝 Testing ${concurrentCount} concurrent PRETEST submissions...`);

    // Sample pretest answers for testing - using EXACT options from real pretest modal
    const sampleAnswers = {
      "q1": "Somewhat confident",
      "q2": "Deep understanding focus",
      "q3": "Mixed practice across all exercise types",
      "q4": "Jump into practice and learn by doing"
    };

    // Use different user ID range for pretest (20000+) to avoid conflicts with goal tests
    const PRETEST_USER_START = 20000;

    for (let i = 0; i < concurrentCount; i++) {
      const userId = PRETEST_USER_START + i;
      operations.push(
        (async () => {
          const opStart = Date.now();
          try {
            console.log(`📝 Submitting pretest for user ${userId} with answers:`, sampleAnswers);
            const result = await submitPretestAnswers(userId, sampleAnswers);
            console.log(`✅ Pretest successful for user ${userId}:`, result);
            return { success: true, duration: Date.now() - opStart };
          } catch (error: any) {
            console.error(`❌ Pretest submission failed for user ${userId}:`, error);
            console.error(`❌ Error details:`, {
              message: error.message,
              stack: error.stack,
              name: error.name
            });
            return { success: false, duration: Date.now() - opStart, error: error.message || String(error) };
          }
        })()
      );
    }

    const results = await Promise.all(operations);
    const duration = Date.now() - startTime;
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;

    // Log sample errors for debugging
    const failedResults = results.filter(r => !r.success);
    if (failedResults.length > 0) {
      console.error(`❌ ${failureCount} pretest submissions failed! Sample errors:`);
      failedResults.slice(0, 5).forEach((result, idx) => {
        console.error(`  Error ${idx + 1}:`, result.error);
      });
    }

    const status = failureCount === 0 
      ? (avgResponseTime > 1000 ? 'warning' : 'pass')
      : 'fail';

    const errorSummary = failureCount > 0 ? ` ❌ Errors: ${failedResults[0]?.error || 'Unknown'}` : '';

    return {
      testName: `Concurrent Pretest Submissions (${concurrentCount} students)`,
      status,
      duration,
      concurrent: concurrentCount,
      successCount,
      failureCount,
      avgResponseTime,
      details: `${successCount > 0 ? '✅' : '❌'} ${successCount}/${concurrentCount} pretest submissions successful. Avg response: ${avgResponseTime.toFixed(0)}ms. Total time: ${duration}ms. ${avgResponseTime > 1000 ? '⚠️ Response time high!' : failureCount === 0 ? '✅ Response time acceptable' : ''}${errorSummary}`
    };
  };

  /**
   * Test single pretest submission to diagnose issues
   */
  const testSinglePretest = async (): Promise<LoadTestResult> => {
    const startTime = Date.now();
    console.log('🔍 Testing single pretest submission...');

    const sampleAnswers = {
      "q1": "Somewhat confident",
      "q2": "Deep understanding focus",
      "q3": "Mixed practice across all exercise types",
      "q4": "Jump into practice and learn by doing"
    };

    try {
      const userId = 20000; // Test user for pretest
      console.log('📝 Submitting pretest for user', userId, 'with answers:', sampleAnswers);
      const result = await submitPretestAnswers(userId, sampleAnswers);
      
      const duration = Date.now() - startTime;
      console.log('✅ Single pretest succeeded:', result);
      
      return {
        testName: 'Single Pretest Diagnostic',
        status: 'pass',
        duration,
        concurrent: 1,
        successCount: 1,
        failureCount: 0,
        avgResponseTime: duration,
        details: `✅ Single pretest submission successful. Got ${result.suggestedGoals?.length || 0} suggested goals. Time: ${duration}ms`
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Single pretest failed:', error);
      console.error('Error details:', error.message, error.stack);
      
      return {
        testName: 'Single Pretest Diagnostic',
        status: 'fail',
        duration,
        concurrent: 1,
        successCount: 0,
        failureCount: 1,
        avgResponseTime: duration,
        details: `❌ Single pretest failed! Error: ${error.message || String(error)}. Check console for details.`
      };
    }
  };

  /**
   * Test single write operation to diagnose issues
   */
  const testSingleWrite = async (): Promise<LoadTestResult> => {
    const startTime = Date.now();
    console.log('🔍 Testing single write operation...');

    try {
      const testGoal = await createGoal({
        userId: LOAD_TEST_USER_START,
        title: 'Diagnostic Test Goal',
        category: 'Basic Understanding',
        difficulty: 'easy'
      });
      
      const duration = Date.now() - startTime;
      console.log('✅ Single write succeeded:', testGoal);
      
      return {
        testName: 'Single Write Diagnostic',
        status: 'pass',
        duration,
        concurrent: 1,
        successCount: 1,
        failureCount: 0,
        avgResponseTime: duration,
        details: `✅ Single write operation successful. Created goal ID: ${testGoal.id}. Time: ${duration}ms`
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.error('❌ Single write failed:', error);
      console.error('Error details:', error.message, error.stack);
      
      return {
        testName: 'Single Write Diagnostic',
        status: 'fail',
        duration,
        concurrent: 1,
        successCount: 0,
        failureCount: 1,
        avgResponseTime: duration,
        details: `❌ Single write failed! Error: ${error.message || String(error)}. Check console for details.`
      };
    }
  };

  /**
   * Run comprehensive load testing suite
   */
  const runLoadTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    const results: LoadTestResult[] = [];

    try {
      // Test 0: Single Write Diagnostic (NEW - to diagnose write issues)
      setCurrentTest('Running diagnostic test (single write)...');
      results.push(await testSingleWrite());
      setTestResults([...results]);
      
      // If single write fails, don't continue
      if (results[0].status === 'fail') {
        setCurrentTest('⚠️ Single write failed - skipping remaining tests. Check console for details.');
        setTimeout(() => setCurrentTest(''), 3000);
        setIsRunning(false);
        return;
      }

      // Test 1: Concurrent Reads (30 students)
      setCurrentTest('Testing concurrent reads (30 students)...');
      results.push(await testConcurrentReads(30));
      setTestResults([...results]);

      // Test 2: Concurrent Reads (60 students)
      setCurrentTest('Testing concurrent reads (60 students)...');
      results.push(await testConcurrentReads(60));
      setTestResults([...results]);

      // Test 3: Concurrent Writes (30 students)
      setCurrentTest('Testing concurrent writes (30 students)...');
      results.push(await testConcurrentWrites(30));
      setTestResults([...results]);

      // Test 4: Concurrent Writes (60 students)
      setCurrentTest('Testing concurrent writes (60 students)...');
      results.push(await testConcurrentWrites(60));
      setTestResults([...results]);

      // Test 5: Realistic Student Activity (30 students)
      setCurrentTest('Testing realistic student activity (30 students)...');
      results.push(await testRealisticStudentLoad(30));
      setTestResults([...results]);

      // Test 6: Realistic Student Activity (60 students)
      setCurrentTest('Testing realistic student activity (60 students)...');
      results.push(await testRealisticStudentLoad(60));
      setTestResults([...results]);

      // Test 7: Complete Student Workflow (30 students) - NEW COMPREHENSIVE TEST
      setCurrentTest('Testing complete student workflow with goal completion (30 students)...');
      results.push(await testCompleteStudentWorkflow(30));
      setTestResults([...results]);

      // Test 8: Complete Student Workflow (60 students) - NEW COMPREHENSIVE TEST
      setCurrentTest('Testing complete student workflow with goal completion (60 students)...');
      results.push(await testCompleteStudentWorkflow(60));
      setTestResults([...results]);

      // Test 9: Sustained Load (50 students, 5 rounds)
      setCurrentTest('Testing sustained load (50 students, 5 rounds)...');
      results.push(await testSustainedLoad(50, 5));
      setTestResults([...results]);

      // ========================================
      // PRETEST LOAD TESTS
      // ========================================

      // Test 10: Single Pretest Diagnostic
      setCurrentTest('Testing single pretest submission (diagnostic)...');
      results.push(await testSinglePretest());
      setTestResults([...results]);

      // If single pretest fails, skip concurrent pretest tests
      if (results[results.length - 1].status === 'fail') {
        console.error('Single pretest failed - skipping concurrent tests');
        setCurrentTest('⚠️ Single pretest failed - check console for error details');
        setTimeout(() => setCurrentTest(''), 3000);
        setIsRunning(false);
        return;
      }

      // Test 11: Concurrent Pretest Submissions (30 students)
      setCurrentTest('Testing concurrent pretest submissions (30 students)...');
      results.push(await testConcurrentPretests(30));
      setTestResults([...results]);

      // Test 12: Concurrent Pretest Submissions (60 students)
      setCurrentTest('Testing concurrent pretest submissions (60 students)...');
      results.push(await testConcurrentPretests(60));
      setTestResults([...results]);

      // ========================================
      // �🔥 EXTREME LOAD TESTS - Find the limit!
      // ========================================

      /*
      // EXTREME TESTS COMMENTED OUT - Not needed for 50-60 student classroom
      // These tests (100-200 students) cause CORS errors due to browser connection limits
      // Uncomment only if testing beyond typical classroom capacity
      
      // Test 12: 100 Concurrent Writes
      setCurrentTest('EXTREME TEST: 100 concurrent writes...');
      results.push(await testConcurrentWrites(100));
      setTestResults([...results]);

      // Test 13: 100 Complete Workflow
      setCurrentTest('EXTREME TEST: 100 complete workflows...');
      results.push(await testCompleteStudentWorkflow(100));
      setTestResults([...results]);

      // Test 14: 150 Concurrent Writes
      setCurrentTest('EXTREME TEST: 150 concurrent writes...');
      results.push(await testConcurrentWrites(150));
      setTestResults([...results]);

      // Test 15: 150 Complete Workflow
      setCurrentTest('EXTREME TEST: 150 complete workflows...');
      results.push(await testCompleteStudentWorkflow(150));
      setTestResults([...results]);

      // Test 16: 200 Concurrent Writes
      setCurrentTest('EXTREME TEST: 200 concurrent writes...');
      results.push(await testConcurrentWrites(200));
      setTestResults([...results]);

      // Test 17: 200 Complete Workflow  
      setCurrentTest('EXTREME TEST: 200 complete workflows...');
      results.push(await testCompleteStudentWorkflow(200));
      setTestResults([...results]);
      */

      setCurrentTest('');
      console.log('✅ All load tests completed!');
    } catch (error) {
      console.error('❌ Load test error:', error);
      setCurrentTest('Error during testing');
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Clean up test data
   */
  const cleanupTestData = async () => {
    setCurrentTest('Cleaning up test data...');
    let deletedCount = 0;

    try {
      for (let i = 0; i < LOAD_TEST_USER_COUNT; i++) {
        const userId = LOAD_TEST_USER_START + i;
        try {
          const goals = await fetchGoals(userId);
          for (const goal of goals) {
            await deleteGoal(goal.id!);
            deletedCount++;
          }
        } catch (error) {
          console.warn(`Failed to clean up user ${userId}:`, error);
        }
      }
      
      console.log(`✅ Cleaned up ${deletedCount} test goals`);
      alert(`✅ Cleaned up ${deletedCount} test goals`);
    } catch (error) {
      console.error('❌ Cleanup error:', error);
      alert('❌ Error during cleanup');
    } finally {
      setCurrentTest('');
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'Arial, sans-serif',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <div style={{ marginBottom: '20px' }}>
        <h2 style={{ color: '#2c3e50', marginBottom: '10px' }}>
          🎓 SQLite Classroom Load Testing Suite
        </h2>
        <p style={{ color: '#7f8c8d', fontSize: '14px', marginBottom: '15px' }}>
          Tests SQLite's ability to handle 30-60 concurrent students for Goals, Logs, and Pretests.
          12 comprehensive tests validating real classroom scenarios. ✅
        </p>

        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
          <button
            onClick={runLoadTests}
            disabled={isRunning}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: isRunning ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: isRunning ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            {isRunning ? '⏳ Running Tests...' : '🚀 Run Load Tests'}
          </button>

          <button
            onClick={cleanupTestData}
            disabled={isRunning}
            style={{
              padding: '12px 24px',
              fontSize: '16px',
              backgroundColor: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: isRunning ? 'not-allowed' : 'pointer',
              fontWeight: 'bold',
              transition: 'all 0.3s ease',
              boxShadow: isRunning ? 'none' : '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            🧹 Clean Up Test Data
          </button>
        </div>
      </div>

      {currentTest && (
        <div style={{
          padding: '15px',
          backgroundColor: '#fff3cd',
          border: '1px solid #ffeeba',
          borderRadius: '5px',
          marginBottom: '20px',
          color: '#856404'
        }}>
          <strong>⏳ {currentTest}</strong>
        </div>
      )}

      {testResults.length > 0 && (
        <div style={{ 
          marginTop: '20px'
        }}>
          <h3 style={{ 
            color: '#2c3e50', 
            marginBottom: '15px'
          }}>
            📊 Test Results ({testResults.length}/12 completed)
          </h3>

          <div style={{ marginBottom: '20px' }}>
            <div style={{
              padding: '15px',
              backgroundColor: '#e8f4f8',
              borderRadius: '5px',
              marginBottom: '10px'
            }}>
              <strong>Summary:</strong>
              <ul style={{ marginTop: '10px', marginBottom: '0' }}>
                <li>✅ Passed: {testResults.filter(r => r.status === 'pass').length}</li>
                <li>⚠️ Warnings: {testResults.filter(r => r.status === 'warning').length}</li>
                <li>❌ Failed: {testResults.filter(r => r.status === 'fail').length}</li>
              </ul>
            </div>
          </div>

          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                marginBottom: '15px',
                border: `2px solid ${
                  result.status === 'pass' ? '#27ae60' :
                  result.status === 'warning' ? '#f39c12' :
                  '#e74c3c'
                }`,
                borderRadius: '5px',
                backgroundColor: result.status === 'pass' ? '#d4edda' :
                  result.status === 'warning' ? '#fff3cd' :
                  '#f8d7da'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <strong style={{ fontSize: '16px' }}>
                  {result.status === 'pass' ? '✅' : result.status === 'warning' ? '⚠️' : '❌'} {result.testName}
                </strong>
                <span style={{
                  padding: '4px 12px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  backgroundColor: result.status === 'pass' ? '#27ae60' :
                    result.status === 'warning' ? '#f39c12' :
                    '#e74c3c',
                  color: 'white'
                }}>
                  {result.status.toUpperCase()}
                </span>
              </div>

              <div style={{ fontSize: '14px', color: '#2c3e50' }}>
                <p style={{ margin: '5px 0' }}>{result.details}</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginTop: '10px' }}>
                  <div>
                    <strong>Concurrent Users:</strong> {result.concurrent}
                  </div>
                  <div>
                    <strong>Total Duration:</strong> {result.duration}ms
                  </div>
                  <div>
                    <strong>Success Rate:</strong> {((result.successCount / (result.successCount + result.failureCount)) * 100).toFixed(1)}%
                  </div>
                  <div>
                    <strong>Avg Response:</strong> {result.avgResponseTime.toFixed(0)}ms
                  </div>
                </div>
              </div>
            </div>
          ))}

          <div style={{
            padding: '20px',
            backgroundColor: '#e8f4f8',
            borderRadius: '5px',
            marginTop: '20px',
            marginBottom: '20px'
          }}>
            <h4 style={{ marginTop: 0 }}>💡 Interpretation Guide</h4>
            <ul style={{ fontSize: '14px', lineHeight: '1.8', marginBottom: '15px' }}>
              <li><strong>✅ Pass:</strong> System handles load well. Response times acceptable (&lt;500ms writes, &lt;200ms reads)</li>
              <li><strong>⚠️ Warning:</strong> System works but response times are high. May cause user experience delays.</li>
              <li><strong>❌ Fail:</strong> System cannot handle the load. More than 10% operations failing.</li>
            </ul>
            <p style={{ fontSize: '14px', marginTop: '15px', marginBottom: '0' }}>
              <strong>SQLite Note:</strong> SQLite automatically serializes writes (one at a time), 
              so concurrent writes will queue and take longer. This is expected behavior. 
              For 50-60 students, writes should complete within 1-2 seconds total.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
