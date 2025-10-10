import { useState } from 'react';
import { GoalSystemTestComponent } from '../components/testing/GoalSystemTestComponent';
import { AdaptiveFeedbackTestComponent } from '../components/testing/AdaptiveFeedbackTestComponent';
import { RecommendationSystemTest } from '../components/testing/RecommendationSystemTest';
import { SQLiteLoadTestComponent } from '../components/testing/SQLiteLoadTestComponent';

export default function TestingSuite() {
  const [activeTab, setActiveTab] = useState<'goals' | 'feedback' | 'recommendations' | 'loadtest'>('goals');

  const tabStyle = (isActive: boolean) => ({
    padding: '12px 24px',
    fontSize: '16px',
    fontWeight: 'bold',
    border: 'none',
    borderRadius: '8px 8px 0 0',
    cursor: 'pointer',
    backgroundColor: isActive ? '#007bff' : '#e9ecef',
    color: isActive ? 'white' : '#495057',
    marginRight: '4px',
    transition: 'all 0.3s ease'
  });

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8f9fa', 
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px 20px',
        textAlign: 'center',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{ 
          margin: '0 0 10px 0', 
          fontSize: '2.5rem', 
          fontWeight: 'bold' 
        }}>
          🧪 Goal System Testing Suite
        </h1>
        <p style={{ 
          margin: '0', 
          fontSize: '1.2rem', 
          opacity: 0.9 
        }}>
          Comprehensive testing for goal creation, completion, recommendations, adaptive feedback, and database load
        </p>
        <div style={{ 
          marginTop: '20px', 
          fontSize: '1rem', 
          opacity: 0.8 
        }}>
          <span style={{ marginRight: '20px' }}>
            ✅ Goal CRUD Operations
          </span>
          <span style={{ marginRight: '20px' }}>
            🎯 Completion Flow
          </span>
          <span style={{ marginRight: '20px' }}>
            🧠 Adaptive Feedback
          </span>
          <span style={{ marginRight: '20px' }}>
            📊 Recommendation Engine
          </span>
          <span>
            🔥 SQLite Load Testing
          </span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ 
        padding: '0 20px', 
        backgroundColor: 'white',
        borderBottom: '1px solid #dee2e6'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto',
          display: 'flex',
          paddingTop: '20px'
        }}>
          <button
            onClick={() => setActiveTab('goals')}
            style={tabStyle(activeTab === 'goals')}
          >
            🎯 Goal System Tests
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            style={tabStyle(activeTab === 'recommendations')}
          >
            💡 Recommendation Tests
          </button>
          <button
            onClick={() => setActiveTab('feedback')}
            style={tabStyle(activeTab === 'feedback')}
          >
            🧠 Adaptive Feedback Tests
          </button>
          <button
            onClick={() => setActiveTab('loadtest')}
            style={tabStyle(activeTab === 'loadtest')}
          >
            🔥 SQLite Load Tests
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div style={{ backgroundColor: 'white', minHeight: 'calc(100vh - 200px)' }}>
        {activeTab === 'goals' ? (
          <div>
            {/* Goals Tab Description */}
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '20px',
              borderBottom: '1px solid #e9ecef'
            }}>
              <h2 style={{ color: '#333', marginBottom: '10px' }}>
                🎯 Goal System Comprehensive Testing
              </h2>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                This test suite validates the entire goal system workflow including creation, completion, 
                recommendation generation, and integration with the adaptive feedback system.
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
                gap: '15px',
                marginTop: '15px'
              }}>
                <div style={{ 
                  backgroundColor: '#e8f5e8', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #d4edda'
                }}>
                  <strong style={{ color: '#155724' }}>✅ Goal Creation</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests CRUD operations for all goal categories and difficulty levels
                  </small>
                </div>
                <div style={{ 
                  backgroundColor: '#e3f2fd', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #bbdefb'
                }}>
                  <strong style={{ color: '#0d47a1' }}>🎯 Goal Completion</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests completion flow with mock exercise data and emotional scores
                  </small>
                </div>
                <div style={{ 
                  backgroundColor: '#fff3e0', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #ffcc02'
                }}>
                  <strong style={{ color: '#e65100' }}>📊 Recommendations</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests the recommendation engine and API integration
                  </small>
                </div>
                <div style={{ 
                  backgroundColor: '#f3e5f5', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #ce93d8'
                }}>
                  <strong style={{ color: '#4a148c' }}>🧠 Integration</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests integration with adaptive feedback and progressive tracking
                  </small>
                </div>
              </div>
            </div>
            <GoalSystemTestComponent />
          </div>
        ) : activeTab === 'recommendations' ? (
          <div>
            {/* Recommendations Tab Description */}
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '20px',
              borderBottom: '1px solid #e9ecef'
            }}>
              <h2 style={{ color: '#333', marginBottom: '10px' }}>
                💡 Adaptive Recommendation System Testing
              </h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Comprehensive testing of the recommendation engine with 7 different performance scenarios
                to ensure proper goal suggestions and priority handling.
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  backgroundColor: '#e8f5e8', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #d4edda'
                }}>
                  <strong style={{ color: '#155724' }}>� New Users</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests beginner-friendly goal recommendations
                  </small>
                </div>
                <div style={{ 
                  backgroundColor: '#ffebee', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #f8bbd0'
                }}>
                  <strong style={{ color: '#c62828' }}>� High Errors</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests accuracy-focused recommendations
                  </small>
                </div>
                <div style={{ 
                  backgroundColor: '#fff3e0', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #ffcc02'
                }}>
                  <strong style={{ color: '#e65100' }}>💡 High Hints</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests independence-focused recommendations
                  </small>
                </div>
                <div style={{ 
                  backgroundColor: '#f3e5f5', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #e1bee7'
                }}>
                  <strong style={{ color: '#6a1b9a' }}>⚡ Conflicts</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests priority handling (Errors &gt; Hints &gt; Satisfaction)
                  </small>
                </div>
              </div>
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <strong style={{ color: '#495057' }}>� Test Scenarios:</strong>
                <ul style={{ marginTop: '10px', color: '#666', fontSize: '0.9rem' }}>
                  <li>✅ New User (Zero Goals) - Basic Understanding + Learning & Growth</li>
                  <li>✅ High Errors Only - Problem Solving (accuracy goals)</li>
                  <li>✅ High Hints Only - Problem Solving + Method Mastery (independence)</li>
                  <li>✅ High Errors + High Hints - Priority: ERRORS (accuracy first)</li>
                  <li>✅ High Errors + Low Satisfaction - Priority: ERRORS with motivation</li>
                  <li>✅ Low Satisfaction Only - Learning & Growth (confidence building)</li>
                  <li>✅ Good Performance - Natural category progression</li>
                </ul>
              </div>
            </div>
            <RecommendationSystemTest />
          </div>
        ) : activeTab === 'loadtest' ? (
          <div style={{ 
            height: 'calc(100vh - 280px)', 
            overflowY: 'auto',
            overflowX: 'hidden'
          }}>
            {/* Load Testing Tab Content - Compact Version */}
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '15px 20px',
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #e9ecef'
            }}>
              <h2 style={{ color: '#333', marginBottom: '8px', fontSize: '1.5rem' }}>
                🔥 SQLite Load Testing
              </h2>
              <p style={{ color: '#666', marginBottom: '10px', fontSize: '0.9rem' }}>
                Tests 50-60 concurrent students with 9 comprehensive scenarios including complete goal workflows with emotional data.
              </p>
              <details style={{ marginBottom: '10px' }}>
                <summary style={{ 
                  cursor: 'pointer', 
                  color: '#007bff', 
                  fontWeight: 'bold',
                  fontSize: '0.9rem',
                  padding: '5px 0'
                }}>
                  📊 Click to view test scenarios details (9 total)
                </summary>
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '10px',
                  marginTop: '10px'
                }}>
                  <div style={{ 
                    backgroundColor: '#e8f5e8', 
                    padding: '10px', 
                    borderRadius: '5px',
                    border: '1px solid #d4edda'
                  }}>
                    <strong style={{ color: '#155724', fontSize: '0.85rem' }}>📖 Concurrent Reads</strong>
                    <br />
                    <small style={{ color: '#666', fontSize: '0.75rem' }}>
                      30 & 60 students fetching goals
                    </small>
                  </div>
                  <div style={{ 
                    backgroundColor: '#ffebee', 
                    padding: '10px', 
                    borderRadius: '5px',
                    border: '1px solid #f8bbd0'
                  }}>
                    <strong style={{ color: '#c62828', fontSize: '0.85rem' }}>✍️ Concurrent Writes</strong>
                    <br />
                    <small style={{ color: '#666', fontSize: '0.75rem' }}>
                      30 & 60 students creating goals
                    </small>
                  </div>
                  <div style={{ 
                    backgroundColor: '#e3f2fd', 
                    padding: '10px', 
                    borderRadius: '5px',
                    border: '1px solid #bbdefb'
                  }}>
                    <strong style={{ color: '#0d47a1', fontSize: '0.85rem' }}>🎓 Realistic Activity</strong>
                    <br />
                    <small style={{ color: '#666', fontSize: '0.75rem' }}>
                      30 & 60 students mixed operations
                    </small>
                  </div>
                  <div style={{ 
                    backgroundColor: '#fff3e0', 
                    padding: '10px', 
                    borderRadius: '5px',
                    border: '1px solid #ffcc02'
                  }}>
                    <strong style={{ color: '#e65100', fontSize: '0.85rem' }}>⏱️ Sustained Load</strong>
                    <br />
                    <small style={{ color: '#666', fontSize: '0.75rem' }}>
                      50 students × 5 rounds
                    </small>
                  </div>
                </div>
              </details>
            </div>
            <SQLiteLoadTestComponent />
          </div>
        ) : (
          <div>
            {/* Feedback Tab Content */}
            <div style={{
              maxWidth: '1200px',
              margin: '0 auto',
              padding: '20px',
              borderBottom: '1px solid #e9ecef'
            }}>
              <h2 style={{ color: '#333', marginBottom: '10px' }}>
                🧠 Adaptive Feedback System Testing
              </h2>
              <p style={{ color: '#666', marginBottom: '20px' }}>
                Tests adaptive feedback generation with all performance patterns and validates today's bug fixes.
              </p>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '15px',
                marginBottom: '20px'
              }}>
                <div style={{ 
                  backgroundColor: '#ffe8e8', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #ffcccb'
                }}>
                  <strong style={{ color: '#721c24' }}>🐛 Bug Fixes</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests the specific "4 errors + 5 hints + anxiety=5" bug fix
                  </small>
                </div>
                <div style={{ 
                  backgroundColor: '#e8f5e8', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #d4edda'
                }}>
                  <strong style={{ color: '#155724' }}>🏗️ Architecture</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests single source of truth and session data persistence
                  </small>
                </div>
                <div style={{ 
                  backgroundColor: '#e3f2fd', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #bbdefb'
                }}>
                  <strong style={{ color: '#0d47a1' }}>🎭 Patterns</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests all 6 performance patterns with priority logic
                  </small>
                </div>
                <div style={{ 
                  backgroundColor: '#fff3e0', 
                  padding: '15px', 
                  borderRadius: '8px',
                  border: '1px solid #ffcc02'
                }}>
                  <strong style={{ color: '#e65100' }}>🔗 Integration</strong>
                  <br />
                  <small style={{ color: '#666' }}>
                    Tests goal recommendation API and progressive tracking
                  </small>
                </div>
              </div>
              <div style={{
                marginTop: '20px',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #dee2e6'
              }}>
                <strong style={{ color: '#495057' }}>🆕 Today's Updates:</strong>
                <ul style={{ marginTop: '10px', color: '#666', fontSize: '0.9rem' }}>
                  <li>✅ Fixed dual feedback issue (single source of truth)</li>
                  <li>✅ Added session data persistence testing</li>
                  <li>✅ Added goal recommendation API integration tests</li>
                  <li>✅ Added specific bug fix validation (struggling vs outstanding)</li>
                  <li>✅ Added pattern priority logic testing</li>
                </ul>
              </div>
            </div>
            <AdaptiveFeedbackTestComponent />
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        backgroundColor: '#333',
        color: 'white',
        padding: '20px',
        textAlign: 'center',
        marginTop: '40px'
      }}>
        <p style={{ margin: '0', opacity: 0.8 }}>
          🧪 Goal System Testing Suite • Built for comprehensive validation • 
          Run tests regularly to ensure system integrity
        </p>
      </div>
    </div>
  );
}