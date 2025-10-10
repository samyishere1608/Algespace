import React, { useState } from 'react';
import { submitPretestAnswers } from '@/utils/api';
import { PretestModalProps, PretestAnswers } from '@/types/pretest';
import './PretestModal.css';

// Goal completion guidance mapping
const goalCompletionGuide: Record<string, string> = {
  // Basic Understanding (5 goals)
  "Learn what linear equations are": "🎯 How to Complete:\n• Start any Flexibility Exercise (Suitability, Efficiency, or Matching)\n• This goal completes automatically when you first access linear equation content\n\n📚 Completes on first exercise access!",
  
  "Understand how substitution works": "🔄 How to Complete:\n• Complete 1 exercise using the Substitution method\n• Choose substitution in any Flexibility Exercise\n• Successfully solve the problem\n\n📚 Specific Exercises for Substitution:\n• Exercise #2 (Efficiency) - Substitution focus\n• Exercise #9 (Matching) - Substitution practice\n• Any Suitability exercise - Choose substitution when appropriate\n\n💡 Completes after your first successful substitution exercise!",
  
  "Understand how elimination works": "⚖️ How to Complete:\n• Complete 1 exercise using the Elimination method\n• Choose elimination in any Flexibility Exercise\n• Successfully solve the problem\n\n📚 Specific Exercises for Elimination:\n• Exercise #6 (Efficiency) - Elimination focus\n• Exercise #7 (Matching) - Elimination practice\n• Exercise #11 (Efficiency) - More elimination practice\n• Any Suitability exercise - Choose elimination when appropriate\n\n💡 Completes after your first successful elimination exercise!",
  
  "Understand how equalization works": "⚖️ How to Complete:\n• Complete 1 exercise using the Equalization method\n• Choose equalization in any Flexibility Exercise\n• Successfully solve the problem\n\n📚 Specific Exercises for Equalization:\n• Exercise #2 (Matching) - Equalization focus\n• Exercise #13 (Matching) - More equalization practice\n• Any Suitability exercise - Choose equalization when appropriate\n\n� Completes after your first successful equalization exercise!",


  // Method Mastery (5 goals)
  "Master substitution/equalization/elimination method": "🏆 How to Complete:\n• Complete 2 exercises either using Substitution/Equalization/Elimination method\n• Shows growing competence with substitution\n• Can be any combination of exercise types\n\n⭐ Completes after your second substitution exercise success!",
  
  "Practice with different methods": "🔄 How to Complete:\n• Use 2 different methods across any exercises\n• For example: 1 substitution exercise + 1 elimination exercise\n• Shows willingness to explore different approaches\n\n� Completes when you've tried 2 different methods!",
  
  "Switch methods strategically": "🧠 How to Complete:\n• Complete 3 exercises using different methods each time\n• Demonstrates strategic method selection\n• Shows flexibility in problem-solving approach\n\n🎯 Completes after using 3 different methods across 3 exercises!",
  
  "Choose optimal methods consistently": "⚡ How to Complete:\n• Complete 3 Efficiency Exercises (where method choice matters most)\n• Focuses on optimal method selection\n• Shows consistent strategic thinking\n\n🚀 Completes after 3 successful Efficiency Exercise completions!",

  "Master all three methods fluently": "🏆 How to Complete:\n• Complete 2+ exercises with each method (substitution, elimination, equalization)\n• Demonstrates comprehensive method mastery\n• Shows fluency across all solving approaches\n\n📚 Method-Specific Exercises:\n• Substitution: Efficiency #2, Matching #9\n• Elimination: Efficiency #6&#11, Matching #7\n• Equalization: Matching #2&#13\n• All Methods: Any Suitability exercise\n\n� Completes when you've mastered all three methods individually!",

  // Problem Solving (5 goals)
  "Complete exercises without hints": "🎖️ How to Complete:\n• Complete 1 exercise using 0 hints\n• Demonstrates full independence on that exercise\n• Shows confidence in your abilities\n\n💪 Completes when you finish an exercise without any hints!",
  
  "Solve problems with minimal errors": "⭐ How to Complete:\n• Complete 1 exercise with ≤1 error\n• Shows accuracy and careful problem-solving\n• Focus on precision over speed\n\n🎯 Completes when you make 1 or fewer errors in an exercise!",
  
  "Handle complex problems confidently": "🌟 How to Complete:\n• Complete 5 total exercises (any type/method)\n• Shows sustained engagement and practice\n• Builds confidence through experience\n\n� Completes after your 5th total exercise completion!",
  
  "Show exceptional problem-solving": "🏅 How to Complete:\n• Complete 1 exercise with 0 errors AND 0 hints\n• Demonstrates exceptional skill and independence\n• The perfect exercise completion\n\n🏆 Completes when you achieve a flawless exercise (no errors, no hints)!",

  "Maintain accuracy under pressure": "� How to Complete:\n• Complete 5+ exercises with average ≤1 error across all exercises\n• Shows consistent accuracy over time\n• Demonstrates skill under sustained challenge\n\n📊 Completes when your overall error average ≤1.0 across 5+ exercises!",

  // Learning & Growth (5 goals)  
  "Build confidence through success": "� How to Complete:\n• Complete 1 exercise using 2 or fewer hints\n• Shows growing independence\n• Focus on working with less assistance\n\n⭐ Completes when hint usage is 2 or less in an exercise!",
  
  "Develop problem-solving resilience": "🌱 How to Complete:\n• Complete 1 exercise after making at least 1 error\n• Shows ability to recover and persist through mistakes\n• Demonstrates growth mindset and resilience\n\n💪 Completes when you successfully finish an exercise despite making errors!",
  
  "Learn from mistakes effectively": "📈 How to Complete:\n• Complete exercises where recent performance shows fewer errors than earlier attempts\n• Demonstrates improvement over time through learning\n• Shows growth mindset in action\n\n� Completes when error tracking shows clear improvement trend!",
  
  "Set personal learning challenges": "� How to Complete:\n• Complete 10 total exercises (any type/method)\n• Shows commitment to sustained learning\n• Demonstrates self-directed challenge-seeking\n\n🏆 Completes after your 10th total exercise completion!",
  
  "Track progress meaningfully": "📊 How to Complete:\n• Complete exercises using all 3 different methods (substitution, elimination, equalization)\n• Shows comprehensive engagement with all approaches\n• Demonstrates holistic learning approach\n\n🌟 Completes when you've successfully used all three methods!",
  
  "Reflect on method effectiveness": "🤔 How to Complete:\n• Complete an exercise with self-explanation in Matching Exercise\n• Provide thoughtful reasoning about method choices\n• Shows deeper analytical thinking\n\n� Completes when you engage with self-explanation features!",
  
  "Explain reasoning clearly": "�️ How to Complete:\n• Complete 3 exercises with self-explanation components\n• Consistently engage with reasoning prompts\n• Shows strong metacognitive skills\n\n🧠 Completes after 3 successful self-explanation exercises!",
  
  "Show consistent improvement": "📈 How to Complete:\n• Complete 4 exercises with decreasing error rates over time\n• Demonstrates sustained learning and improvement\n• Shows mastery through consistent progress\n\n🎯 Completes when error data shows consistent improvement trend!",
  
  "Work independently": "👑 How to Complete:\n• Complete 3 exercises with 0 hints each\n• Shows consistent independent problem-solving\n• Demonstrates true mastery and confidence\n\n� The ultimate independence achievement - 3 hint-free exercises!"
};

export const PretestModal: React.FC<PretestModalProps> = ({ isOpen, onClose, onComplete, userId }) => {
  const questions = [
    {
      question: "How confident are you with math problem-solving?",
      options: ["Not confident at all", "Somewhat confident", "Very confident", "Expert level"]
    },
    {
      question: "What type of goals do you prefer?",
      options: ["Quick practice sessions", "Deep understanding focus", "Problem variety", "Skill building"]
    }
  ];

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<PretestAnswers>({});
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [showResults, setShowResults] = useState(false);
  const [suggestedGoals, setSuggestedGoals] = useState<string[]>([]);
  const [showGuidance, setShowGuidance] = useState<string | null>(null);

  const handleAnswer = () => {
    if (!selectedOption) return;

    const questionKey = `q${currentQuestionIndex + 1}`;
    const newAnswers = { ...answers, [questionKey]: selectedOption };
    setAnswers(newAnswers);
    setSelectedOption('');

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // All questions answered, generate suggestions
      generateSuggestions(newAnswers);
    }
  };

  const generateSuggestions = async (finalAnswers: PretestAnswers) => {
    try {
      console.log('Submitting pretest answers:', finalAnswers);
      const result = await submitPretestAnswers(userId, finalAnswers);
      console.log('Pretest submission result:', result);
      console.log('Suggested goals from result:', result.suggestedGoals);
      
      setSuggestedGoals(result.suggestedGoals || []);
      setShowResults(true);
    } catch (error) {
      console.error('Error calling backend:', error);
      alert('Unable to save assessment. Please try again.');
      onClose();
    }
  };

  const handleComplete = () => {
    onComplete(suggestedGoals);
    onClose();
  };

  if (!isOpen) return null;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  return (
    <div className="pretest-modal-overlay">
      <div className="pretest-modal">
        {!showResults && (
          <>
            <div className="pretest-header">
              <h2>📚 Quick Assessment</h2>
              <p>Help us suggest the best goals for your learning journey!</p>
              <button onClick={onClose} className="skip-button">
                Skip Assessment
              </button>
            </div>

            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress}%` }}></div>
              <div className="progress-text">
                Question {currentQuestionIndex + 1} of {questions.length}
              </div>
            </div>

            <div className="question-container">
              <h3 className="question-text">{currentQuestion.question}</h3>
              
              <div className="options-container">
                {currentQuestion.options.map((option: string, index: number) => (
                  <label key={index} className="option-label">
                    <input
                      type="radio"
                      name="question-option"
                      value={option}
                      checked={selectedOption === option}
                      onChange={(e) => setSelectedOption(e.target.value)}
                    />
                    <span className="option-text">{option}</span>
                  </label>
                ))}
              </div>

              <button
                onClick={handleAnswer}
                disabled={!selectedOption}
                className="next-button"
              >
                {currentQuestionIndex < questions.length - 1 ? 'Next Question' : 'Complete Assessment'}
              </button>
            </div>
          </>
        )}

        {showResults && (
          <div className="results-container">
            <h3>🎯 Assessment Complete!</h3>
            
            <div className="score-display">
              <p><strong>Questions Answered:</strong> {questions.length}</p>
              <p><strong>Personalized learning path ready!</strong></p>
            </div>

            <div className="suggested-goals">
              <h4>🎯 Recommended Goals for You:</h4>
              {suggestedGoals && suggestedGoals.length > 0 ? (
                <div className="goals-list">
                  <p style={{ marginBottom: '16px', color: '#666', fontSize: '0.9rem' }}>
                    Based on your assessment, here are {suggestedGoals.length} personalized goals that match your learning level:
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {suggestedGoals.map((goal: string, index: number) => {
                      // Parse the new format "Category|Title|Difficulty"
                      const goalParts = goal.split('|');
                      
                      if (goalParts.length === 3) {
                        const [category, title, difficulty] = goalParts;
                        
                        // Get difficulty color and emoji
                        const getDifficultyStyle = (diff: string) => {
                          const diffLower = diff.toLowerCase();
                          if (diffLower.includes('very easy')) return { color: '#28a745', emoji: '🟢', label: 'Very Easy' };
                          if (diffLower.includes('easy')) return { color: '#20c997', emoji: '🟡', label: 'Easy' };
                          if (diffLower.includes('medium')) return { color: '#ffc107', emoji: '🟠', label: 'Medium' };
                          if (diffLower.includes('hard') && !diffLower.includes('very')) return { color: '#fd7e14', emoji: '🔴', label: 'Hard' };
                          if (diffLower.includes('very hard')) return { color: '#dc3545', emoji: '⚫', label: 'Very Hard' };
                          return { color: '#6c757d', emoji: '⚪', label: difficulty };
                        };
                        
                        const diffStyle = getDifficultyStyle(difficulty);
                        
                        return (
                          <div key={index} style={{ 
                            padding: '14px',
                            backgroundColor: '#f8f9ff',
                            borderRadius: '8px',
                            border: '1px solid #e1e8ff',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
                          }}>
                            <div style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              marginBottom: '8px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ 
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  color: '#64748b',
                                  textTransform: 'uppercase'
                                }}>
                                  Category:
                                </span>
                                <span style={{ 
                                  fontSize: '0.85rem',
                                  fontWeight: '600',
                                  color: '#007bff',
                                  padding: '2px 8px',
                                  backgroundColor: '#e3f2fd',
                                  borderRadius: '4px'
                                }}>
                                  {category}
                                </span>
                              </div>
                              <div style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span style={{ 
                                  fontSize: '0.7rem',
                                  fontWeight: '600',
                                  color: '#64748b',
                                  textTransform: 'uppercase'
                                }}>
                                  Difficulty:
                                </span>
                                <div style={{ 
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                  fontSize: '0.75rem',
                                  fontWeight: '600',
                                  color: diffStyle.color,
                                  padding: '2px 6px',
                                  backgroundColor: 'white',
                                  borderRadius: '4px',
                                  border: `1px solid ${diffStyle.color}40`
                                }}>
                                  <span>{diffStyle.emoji}</span>
                                  <span>{diffStyle.label}</span>
                                </div>
                              </div>
                            </div>
                            <div style={{ marginBottom: '4px' }}>
                              <span style={{ 
                                fontSize: '0.7rem',
                                fontWeight: '600',
                                color: '#64748b',
                                textTransform: 'uppercase'
                              }}>
                                Goal:
                              </span>
                            </div>
                            <div style={{ 
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              paddingLeft: '8px'
                            }}>
                              <div style={{ 
                                fontSize: '0.95rem',
                                color: '#1e293b',
                                fontWeight: '500',
                                lineHeight: '1.4',
                                flex: 1
                              }}>
                                {title}
                              </div>
                              <button
                                type="button"
                                onClick={() => setShowGuidance(showGuidance === title ? null : title)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  cursor: "pointer",
                                  fontSize: "1rem",
                                  padding: "0.3rem",
                                  borderRadius: "50%",
                                  color: "#007bff",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  width: "24px",
                                  height: "24px",
                                  marginLeft: "8px"
                                }}
                                title="How to complete this goal"
                              >
                                ℹ️
                              </button>
                            </div>
                          </div>
                        );
                      } else {
                        // Fallback for old format "Category - Title"
                        const [category, ...titleParts] = goal.split(' - ');
                        const title = titleParts.join(' - ');
                        
                        return (
                          <div key={index} style={{ 
                            padding: '12px',
                            backgroundColor: '#f0f8ff',
                            borderRadius: '6px',
                            border: '1px solid #e0e8f0'
                          }}>
                            <strong style={{ color: '#007bff' }}>{category}</strong>
                            {title && <span style={{ color: '#333' }}> – {title}</span>}
                          </div>
                        );
                      }
                    })}
                  </div>
                  <div style={{ 
                    marginTop: '16px', 
                    padding: '12px',
                    backgroundColor: '#e8f4fd',
                    borderRadius: '6px',
                    border: '1px solid #bee5eb'
                  }}>
                    <p style={{ 
                      margin: '0', 
                      color: '#0c5460', 
                      fontSize: '0.85rem', 
                      fontWeight: '500'
                    }}>
                      💡 <strong>Progressive Learning:</strong> Start with the first goal, and once you complete it successfully, you'll get suggestions for the next level of difficulty!
                    </p>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  padding: '20px', 
                  backgroundColor: '#f8f9fa', 
                  borderRadius: '8px',
                  textAlign: 'center' 
                }}>
                  <p style={{ color: '#666', marginBottom: '8px' }}>
                    No specific goals suggested based on your answers.
                  </p>
                  <p style={{ color: '#666', fontSize: '0.9rem' }}>
                    You can explore all available goals in the goal setting page!
                  </p>
                </div>
              )}
            </div>

            <div className="results-actions">
              <button onClick={handleComplete} className="complete-button">
                Continue to Goal Setting
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Completion Guidance Modal */}
      {showGuidance && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.8)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000
        }}
        onClick={() => setShowGuidance(null)}
        >
          <div style={{
            backgroundColor: "white",
            padding: "2rem",
            borderRadius: "12px",
            maxWidth: "500px",
            margin: "1rem",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
            border: "3px solid #229EBC"
          }}
          onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "1rem"
            }}>
              <h3 style={{
                margin: 0,
                color: "#229EBC",
                fontSize: "1.2rem",
                fontWeight: "bold"
              }}>
                🎯 How to Complete This Goal
              </h3>
              <button
                onClick={() => setShowGuidance(null)}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#666",
                  padding: "0.2rem"
                }}
              >
                ✕
              </button>
            </div>
            
            <div style={{
              backgroundColor: "#f8f9ff",
              padding: "1rem",
              borderRadius: "8px",
              border: "2px solid #e1e8ff",
              marginBottom: "1rem"
            }}>
              <h4 style={{
                margin: "0 0 0.5rem 0",
                color: "#333",
                fontSize: "1rem",
                fontWeight: "bold"
              }}>
                "{showGuidance}"
              </h4>
            </div>

            <div style={{
              backgroundColor: "#f0f8ff",
              padding: "1.5rem",
              borderRadius: "8px",
              border: "2px solid #229EBC",
              lineHeight: "1.6",
              maxHeight: "300px",
              overflowY: "auto"
            }}>
              <div style={{
                color: "#333",
                fontSize: "0.9rem",
                fontWeight: "500",
                whiteSpace: "pre-line"
              }}>
                {goalCompletionGuide[showGuidance] || "Completion guidance not available for this goal."}
              </div>
            </div>

            <div style={{
              marginTop: "1.5rem",
              textAlign: "center"
            }}>
              <button
                onClick={() => setShowGuidance(null)}
                style={{
                  backgroundColor: "#229EBC",
                  color: "white",
                  border: "none",
                  padding: "0.75rem 1.5rem",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  fontSize: "0.9rem"
                }}
              >
                Got it! 👍
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
