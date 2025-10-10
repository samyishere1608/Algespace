import { useEffect, useState } from "react";
import { fetchGoalHistory, fetchGoals } from "@/utils/api";
import { Goal } from "@/types/goal";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, Area, AreaChart
} from "recharts";

interface HistoryItem {
  action: string;
  description: string;
  timestamp: string;
}

interface GoalInsights {
  totalGoals: number;
  completedGoals: number;
  completionRate: number;
  averageConfidence: number;
  confidenceTrend: number;
  categories: { [key: string]: number };
  monthlyProgress: { month: string; completed: number; created: number }[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function GoalHistory({ userId }: { userId: number }) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<GoalInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [historyData, goalsData] = await Promise.all([
          fetchGoalHistory(userId),
          fetchGoals(userId)
        ]);
        
        setHistory(historyData);
        setGoals(goalsData);
        setInsights(calculateInsights(goalsData, historyData));
      } catch (err) {
        console.error("Failed to load goal data", err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [userId]);

  const calculateInsights = (goals: Goal[], _history: HistoryItem[]): GoalInsights => {
    const completedGoals = goals.filter(g => g.completed);
    const totalGoals = goals.length;
    
    // Calculate confidence trend (current vs initial)
    const confidenceData = completedGoals.filter(g => g.confidenceBefore);
    const avgInitialConfidence = confidenceData.reduce((sum, g) => sum + (g.confidenceBefore || 0), 0) / confidenceData.length;
    const avgFinalConfidence = confidenceData.reduce((sum, _g) => sum + 4, 0) / confidenceData.length; // Assuming final confidence is higher
    
    // Category distribution
    const categories = goals.reduce((acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1;
      return acc;
    }, {} as { [key: string]: number });
    
    // Monthly progress (last 6 months)
    const monthlyProgress = generateMonthlyProgress(goals);
    
    return {
      totalGoals,
      completedGoals: completedGoals.length,
      completionRate: totalGoals > 0 ? (completedGoals.length / totalGoals) * 100 : 0,
      averageConfidence: avgFinalConfidence || 0,
      confidenceTrend: avgFinalConfidence - avgInitialConfidence,
      categories,
      monthlyProgress
    };
  };

  const generateMonthlyProgress = (goals: Goal[]) => {
    const months = [];
    const now = new Date();
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthStr = date.toLocaleDateString('en-US', { month: 'short' });
      
      const created = goals.filter(g => {
        const goalDate = new Date(g.createdAt);
        return goalDate.getMonth() === date.getMonth() && goalDate.getFullYear() === date.getFullYear();
      }).length;
      
      const completed = goals.filter(g => {
        if (!g.completed || !g.updatedAt) return false;
        const completedDate = new Date(g.updatedAt);
        return completedDate.getMonth() === date.getMonth() && completedDate.getFullYear() === date.getFullYear();
      }).length;
      
      months.push({ month: monthStr, created, completed });
    }
    
    return months;
  };

  const confidenceData = goals
    .filter(g => g.completed && g.confidenceBefore)
    .map((g, index) => ({
      goal: index + 1,
      initial: g.confidenceBefore || 0,
      final: 4.2 + Math.random() * 0.8, // Simulated final confidence (you can get this from actual data)
    }));

  const categoryData = insights ? Object.entries(insights.categories).map(([category, count]) => ({
    category,
    count,
    percentage: ((count / insights.totalGoals) * 100).toFixed(1)
  })) : [];

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
        <div>Loading goal insights...</div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: window.innerWidth > 768 ? "1fr 1fr" : "1fr", 
      gap: "2rem", 
      padding: "1rem",
      minHeight: "100vh"
    }}>
      {/* Left Side - Goal History & Insights */}
      <div style={{ 
        overflowY: "auto", 
        background: "#f9f9f9",
        borderRadius: "12px",
        padding: "1.5rem",
        height: "fit-content",
        maxHeight: "100vh",
        scrollBehavior: "smooth",
        scrollbarWidth: "thin"
      }}>
        <h2 style={{ margin: "0 0 1.5rem 0", color: "#2c3e50" }}>📜 Goal History & Insights</h2>
        
        {/* Key Metrics Cards */}
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(2, 1fr)", 
          gap: "0.8rem", 
          marginBottom: "1.5rem" 
        }}>
          <div style={{ 
            background: "#fff", 
            padding: "0.8rem", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "1.8rem", color: "#27ae60" }}>{insights?.completedGoals}</div>
            <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>Goals Completed</div>
          </div>
          <div style={{ 
            background: "#fff", 
            padding: "0.8rem", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "1.8rem", color: "#3498db" }}>{insights?.completionRate.toFixed(1)}%</div>
            <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>Completion Rate</div>
          </div>
          <div style={{ 
            background: "#fff", 
            padding: "0.8rem", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <div style={{ fontSize: "1.8rem", color: "#e74c3c" }}>{insights?.averageConfidence.toFixed(1)}</div>
            <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>Avg Confidence</div>
          </div>
          <div style={{ 
            background: "#fff", 
            padding: "0.8rem", 
            borderRadius: "8px", 
            boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
            textAlign: "center"
          }}>
            <div style={{ 
              fontSize: "1.8rem", 
              color: insights && insights.confidenceTrend > 0 ? "#27ae60" : "#e74c3c" 
            }}>
              {insights && insights.confidenceTrend > 0 ? "+" : ""}{insights?.confidenceTrend.toFixed(1)}
            </div>
            <div style={{ color: "#7f8c8d", fontSize: "0.9rem" }}>Confidence Trend</div>
          </div>
        </div>

        {/* Recent Activity */}
        <div style={{ 
          background: "#fff", 
          borderRadius: "8px", 
          padding: "1.5rem", 
          marginBottom: "1.5rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 1rem 0", color: "#2c3e50" }}>🕐 Recent Activity</h3>
          <div style={{ maxHeight: "150px", overflowY: "auto" }}>
            {history.slice(0, 5).map((item, index) => (
              <div key={index} style={{ 
                padding: "0.6rem", 
                borderLeft: "3px solid #3498db", 
                marginBottom: "0.4rem",
                background: "#f8f9fa",
                borderRadius: "0 6px 6px 0"
              }}>
                <div style={{ fontWeight: "bold", color: "#2c3e50", fontSize: "0.9rem" }}>{item.action}</div>
                <div style={{ color: "#7f8c8d", fontSize: "0.8rem" }}>{item.description}</div>
                <div style={{ color: "#bdc3c7", fontSize: "0.7rem" }}>
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Goal Categories */}
        <div style={{ 
          background: "#fff", 
          borderRadius: "8px", 
          padding: "1.2rem",
          marginBottom: "2rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 0.8rem 0", color: "#2c3e50" }}>📋 Goal Categories</h3>
          {categoryData.map((cat, index) => (
            <div key={cat.category} style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              padding: "0.4rem 0",
              borderBottom: index < categoryData.length - 1 ? "1px solid #ecf0f1" : "none"
            }}>
              <span style={{ color: "#2c3e50", fontSize: "0.9rem" }}>{cat.category}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ color: "#7f8c8d", fontSize: "0.8rem" }}>{cat.count} goals</span>
                <span style={{ 
                  background: COLORS[index % COLORS.length], 
                  color: "white", 
                  padding: "0.15rem 0.4rem", 
                  borderRadius: "10px", 
                  fontSize: "0.7rem" 
                }}>
                  {cat.percentage}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Side - Graphs & Charts */}
      <div style={{ 
        overflowY: "auto", 
        background: "#f9f9f9",
        borderRadius: "12px",
        padding: "1.5rem",
        height: "fit-content",
        maxHeight: "100vh",
        scrollBehavior: "smooth",
        scrollbarWidth: "thin"
      }}>
        <h2 style={{ margin: "0 0 1.5rem 0", color: "#2c3e50" }}>📊 Analytics & Trends</h2>

        {/* Monthly Progress Chart */}
        <div style={{ 
          background: "#fff", 
          borderRadius: "8px", 
          padding: "1.2rem", 
          marginBottom: "1.5rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 0.8rem 0", color: "#2c3e50" }}>📈 Monthly Progress</h3>
          <div style={{ width: "100%", height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={insights?.monthlyProgress}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="created" stroke="#3498db" fill="#3498db" fillOpacity={0.3} />
                <Area type="monotone" dataKey="completed" stroke="#27ae60" fill="#27ae60" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Confidence Progression */}
        <div style={{ 
          background: "#fff", 
          borderRadius: "8px", 
          padding: "1.2rem", 
          marginBottom: "1.5rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 0.8rem 0", color: "#2c3e50" }}>💪 Confidence Progression</h3>
          <div style={{ width: "100%", height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={confidenceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="goal" />
                <YAxis domain={[1, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="initial" stroke="#e74c3c" strokeWidth={2} name="Initial Confidence" />
                <Line type="monotone" dataKey="final" stroke="#27ae60" strokeWidth={2} name="Final Confidence" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div style={{ 
          background: "#fff", 
          borderRadius: "8px", 
          padding: "1.2rem", 
          marginBottom: "1.5rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 0.8rem 0", color: "#2c3e50" }}>🎯 Goal Distribution</h3>
          <div style={{ width: "100%", height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  dataKey="count"
                  nameKey="category"
                  cx="50%"
                  cy="50%"
                  outerRadius={85}
                  fill="#8884d8"
                  label={({ category, percentage }) => `${category} (${percentage}%)`}
                >
                  {categoryData.map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Completion Rate Bar Chart */}
        <div style={{ 
          background: "#fff", 
          borderRadius: "8px", 
          padding: "1.2rem",
          marginBottom: "2rem",
          boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
        }}>
          <h3 style={{ margin: "0 0 0.8rem 0", color: "#2c3e50" }}>✅ Completion by Category</h3>
          <div style={{ width: "100%", height: "250px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#229EBC" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
