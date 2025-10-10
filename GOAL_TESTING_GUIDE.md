GOAL LIST & CATEGORIES
1. Basic Understanding (4 Goals)
Goal
Difficulty
Trigger Condition
Learn what linear equations are
Very Easy
Complete first exercise (any type)
Understand how substitution works
Very Easy
Complete 1 exercise using substitution method
Understand how elimination works
Very Easy
Complete 1 exercise using elimination method
Understand how equalization works
Very Easy
Complete 1 exercise using equalization method


2. Method Mastery (5 Goals)
Goal
Difficulty
Trigger Condition
Master substitution/equalization/elimination method
Easy
Complete 2 exercises with ANY single method (substitution OR elimination OR equalization)
Practice with different methods
Easy
Use 2 different methods across exercises
Switch methods strategically
Medium
Complete 3 exercises using different methods each time
Choose optimal methods consistently
Hard
Complete 3 Efficiency Exercises
Master all three methods fluently
Very Hard
Complete 2+ exercises EACH with substitution AND elimination AND equalization (6+ total)




3. Problem Solving (5 Goals)
Goal
Difficulty
Trigger Condition
Complete exercises without hints
Easy
Complete 1 exercise using 0 hints
Solve problems with minimal errors
Medium
Complete 1 exercise with ≤1 error
Handle complex problems confidently
Medium
Complete 5 total exercises (any type/method)
Show exceptional problem-solving
Hard
Complete 1 exercise with 0 errors AND 0 hints (perfect)
Maintain accuracy under pressure
Very Hard
Complete 5+ exercises with average ≤1 error across all

4. Learning & Growth (9 Goals)
Goal
Difficulty
Trigger Condition
Reflect on method effectiveness
Very Easy
Complete exercise with self-explanation in Matching Exercise
Build confidence through success
Easy
Complete 1 exercise using ≤2 hints
Learn from mistakes effectively
Easy
Show improvement trend (fewer errors over time)
Track progress meaningfully
Medium
Use all 3 methods (substitution + elimination + equalization)
Develop problem-solving resilience
Medium
Complete 1 exercise after making errors (recovery)
Explain reasoning clearly
Medium
Complete 3 exercises with self-explanation components
Show consistent improvement
Hard
Complete 4 exercises with decreasing error rates
Set personal learning challenges
Hard
Complete 10 total exercises (sustained engagement)
Work independently
Very Hard
Complete 3 exercises with 0 hints each




ADAPTIVE FEEDBACK AND RECOMMENDATION CASES
HOW PATTERN DETECTION WORKS
The system analyzes exercise performance data + post-reflection emotions to detect learning patterns and generate personalized feedback and recommendation

HIGH PERFORMANCE PATTERN
Trigger Conditions:
Technical: ≤1 hints AND ≤1 errors
Emotional: High confidence (≥4/5) AND high satisfaction (≥4/5)
OR: Perfect performance (0 hints, 0 errors)
Case Examples:
Case 1: Perfect + Confident Student
{
  "hints": 0,
  "errors": 0,
  "postConfidence": 5,
  "postSatisfaction": 4,
  "postAnxiety": 1
}

🎯 Feedback Generated:
"🚀 Outstanding! Perfect execution with 0 hints and 0 errors! Your confidence is clearly high - you're ready for bigger challenges like 'Work independently'. I've updated your goals to match your excellent progress!"
Case 2: Near-Perfect Performance
{
  "hints": 1,
  "errors": 0,
  "postConfidence": 4,
  "postSatisfaction": 5,
  "postAnxiety": 2
}

🎯 Feedback Generated:
"🌟 Excellent work! Only 1 hints and 0 errors shows real mastery. With your high confidence level, consider challenging yourself with 'Show exceptional problem-solving'. I've updated your recommended goals to push you further!"

STRUGGLING PATTERN
Trigger Conditions:
Technical: ≥3 hints OR ≥3 errors
Emotional: Low confidence (≤2/5) OR low satisfaction (≤2/5) OR high anxiety (≥4/5)
Severe: ≥4 hints AND ≥4 errors + emotional distress
Case Examples:
Case 3: Anxious Struggling Student
{
  "hints": 5,
  "errors": 4,
  "postConfidence": 2,
  "postSatisfaction": 2,
  "postAnxiety": 5
}

🎯 Feedback Generated:
"💪 I see you're feeling anxious, but you persisted through 4 errors and 5 hints - that takes real courage! Consider starting with 'Build confidence through success' to build your confidence back up. I've adjusted your goal recommendations to be more supportive. You've got this! 🤗"
Case 4: High Support Need (No Anxiety)
{
  "hints": 6,
  "errors": 3,
  "postConfidence": 2,
  "postSatisfaction": 3,
  "postAnxiety": 2
}

🎯 Feedback Generated:
"🎯 Working through 3 errors and using 6 hints shows determination! Everyone learns at their own pace. Try 'Learn what linear equations are' to strengthen your foundation first. I've updated your goals to better support your learning journey."

CONSISTENT IMPROVEMENT PATTERN
Trigger Conditions:
Performance: Recent error average < older error average
History: ≥5 total exercises with ≥3 recent exercises
Trend: Clear downward error trend over time
Case Examples:
Case 5: Clear Improvement Trend
{
  "hints": 2,
  "errors": 1,
  "errorHistory": [5, 4, 6, 3, 2, 1], // Older: [5,4,6], Recent: [3,2,1]
  "postConfidence": 4,
  "postSatisfaction": 4
}

🎯 Feedback Generated:
"📈 Amazing progress! Your error rate improved by 50% from 5.0 to 2.0 - you're clearly learning and growing! Keep building on this momentum with 'Show consistent improvement'. I've updated your goals to celebrate and continue your improvement streak!"

MIXED PERFORMANCE PATTERN
Trigger Conditions:
Technical: Good performance (≤2 hints AND ≤2 errors)
Emotional: Low satisfaction (≤2/5) OR high anxiety (≥4/5)
Issue: Technical success but emotional struggle
Case Examples:
Case 6: Technically Good but Frustrated
{
  "hints": 1,
  "errors": 2,
  "postConfidence": 3,
  "postSatisfaction": 1, // Very frustrated
  "postAnxiety": 3
}

🎯 Feedback Generated:
"🎯 You're technically doing well (1 hints, 2 errors), but I sense some frustration. That's completely normal! Consider 'Build confidence through success' to rebuild your enjoyment of learning. I've adjusted your goals to help you feel more successful. Remember, progress isn't always linear! 💙"
Case 7: Good Performance, Low Confidence
{
  "hints": 2,
  "errors": 1,
  "postConfidence": 2, // Low self-confidence
  "postSatisfaction": 3,
  "postAnxiety": 2
}

🎯 Feedback Generated:
"🌱 Good technical performance (2 hints, 1 errors) but I want you to feel more confident too! Try 'Follow a step-by-step example' to boost both your skills and satisfaction. I've updated your goals to support both achievement and confidence."

BUILDING CONFIDENCE PATTERN
Trigger Conditions:
Technical: Reasonable performance (≤2 hints AND ≤2 errors)
Emotional: Good confidence (≥3/5)
Experience: ≥2 total exercises (showing growth)
Case Examples:
Case 8: Steady Confidence Builder
{
  "hints": 2,
  "errors": 2,
  "postConfidence": 4,
  "postSatisfaction": 3,
  "postAnxiety": 2,
  "totalExercises": 4
}

🎯 Feedback Generated:
"🌟 Great work! 2 hints and 2 errors shows you're building solid skills. Your confidence is growing nicely - that's the foundation of all great learning! Ready to try 'Track progress meaningfully' next? I've updated your goals to keep building on this positive momentum!"

GENERIC/FALLBACK PATTERN
Trigger Conditions:
When: No specific pattern matches
Performance: Average performance that doesn't fit other categories
Case Examples:
Case 9: Average Performance
{
  "hints": 3,
  "errors": 2,
  "postConfidence": 3,
  "postSatisfaction": 3,
  "postAnxiety": 3
}

🎯 Feedback Generated:
"🎯 Nice work! You used 3 hints and made 2 errors - every attempt helps you learn! I've updated your recommended goals based on your progress."

GOAL COMPLETION CONTEXT
Special Case: Manual Goal Completion
When users manually complete goals, the system uses mock session data:
{
  "hints": 0,
  "errors": 0,
  "method": "goal_completion",
  "exerciseType": "goal_completion",
  "completedWithSelfExplanation": false,
  "postSatisfaction": 4,
  "postConfidence": 3,
  "postAnxiety": 2
}

🎯 Pattern Detected: High Performance (0 hints, 0 errors) 🎯 Feedback Generated:
"🚀 Outstanding! Perfect execution with 0 hints and 0 errors! Your confidence is clearly high - you're ready for bigger challenges like 'Master substitution/equalization/elimination method'. I've updated your goals to match your excellent progress!"










GOAL RECOMMENDATION SYSTEM - CASES
PRETEST RECOMMENDATIONS
Case 1: Not Confident + Quick Practice
Input: Confidence="Not confident", Goal Type="Quick practice" Suggested Goals:
Basic Understanding|Learn what linear equations are|very easy
Learning & Growth|Build confidence through success|easy
Learning & Growth|Reflect on method effectiveness|very easy
Case 2: Somewhat Confident + Deep Understanding
Input: Confidence="Somewhat confident", Goal Type="Deep understanding" Suggested Goals:
Basic Understanding|Understand how substitution works|very easy
Method Mastery|Practice with different methods|easy
Basic Understanding|Understand how substitution works|very easy
Case 3: Very Confident + Problem Variety
Input: Confidence="Very confident", Goal Type="Problem variety" Suggested Goals:
Method Mastery|Switch methods strategically|medium
Learning & Growth|Track progress meaningfully|medium
Method Mastery|Choose optimal methods consistently|hard
Case 4: Expert + Skill Building
Input: Confidence="Expert", Goal Type="Skill building" Suggested Goals:
Method Mastery|Choose optimal methods consistently|hard
Learning & Growth|Set personal learning challenges|hard
Method Mastery|Master all three methods fluently|very hard

DYNAMIC RECOMMENDATIONS (After Performance Data)
Case 5: New User (No Data)
Performance: TotalGoalsCompleted=0 Suggested Goals:
Basic Understanding|Learn what linear equations are|very easy
Learning & Growth|Reflect on method effectiveness|very easy
Learning & Growth|Build confidence through success|easy
Case 6: Poor Understanding Scores
Performance: AverageActualScore < 0.6 Focus: Basic Understanding + Support Suggested Goals:
Basic Understanding|Learn what linear equations are|very easy
Learning & Growth|Build confidence through success|easy
Learning & Growth|Learn from mistakes effectively|easy
 Case 7: High Hint Usage
Performance: AverageHintsPerGoal > 2 Focus: Method Practice + Independence Suggested Goals:
Method Mastery|Practice with different methods|easy
Problem Solving|Complete exercises without hints|easy
Learning & Growth|Build confidence through success|easy
Case 8: High Error Rate
Performance: AverageErrorsPerGoal > 2 Focus: Accuracy + Careful Problem Solving Suggested Goals:
Problem Solving|Solve problems with minimal errors|medium
Learning & Growth|Learn from mistakes effectively|easy
Learning & Growth|Develop problem-solving resilience|medium
Case 9: Low Satisfaction
Performance: AverageSatisfaction < 3  Focus: Enjoyment + Motivation Suggested Goals:
Learning & Growth|Build confidence through success|easy
Learning & Growth|Reflect on method effectiveness|very easy
Learning & Growth|Develop problem-solving resilience|medium
Case 10: High Performer
Performance: AverageActualScore > 0.8, AverageConfidence > 4 Focus: Advanced Challenges Suggested Goals:
Method Mastery|Choose optimal methods consistently|hard
Problem Solving|Show exceptional problem-solving|hard
Learning & Growth|Work independently|very hard

RECOMMENDATION FLOW SUMMARY
Quick Logic:
No data → Start with basics
Poor scores → Foundation + confidence
High hints → Independence building
High errors → Accuracy focus
Low satisfaction → Motivation boost
High performance → Advanced challenges




