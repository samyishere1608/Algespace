import React from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";

interface HistoryItem {
  action: string;
  description: string;
  timestamp: string;
}

interface Props {
  history: HistoryItem[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const GoalHistoryCharts: React.FC<Props> = ({ history }) => {
  // Count action frequency
  const actionCounts = history.reduce((acc: Record<string, number>, item) => {
    acc[item.action] = (acc[item.action] || 0) + 1;
    return acc;
  }, {});

  const actionData = Object.entries(actionCounts).map(([action, count]) => ({
    action,
    count,
  }));

  // Pie chart example for actions
  return (
    <div style={{ marginTop: "2rem" }}>
      <h3>📊 Goal Activity Summary (Chart)</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={actionData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="action" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="count" fill="#229EBC" />
        </BarChart>
      </ResponsiveContainer>

      <h4 style={{ marginTop: "2rem" }}>🎯 Action Distribution</h4>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={actionData}
            dataKey="count"
            nameKey="action"
            outerRadius={80}
            fill="#8884d8"
            label
          >
            {actionData.map((_, index) => (
              <Cell key={index} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GoalHistoryCharts;
