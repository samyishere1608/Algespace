import { useAuth } from "@/contexts/AuthProvider";
import GoalHistory from "@/components/GoalHistory";

export default function GoalHistoryStatsView() {
  const { user } = useAuth();
  const userId = user?.id || 1; // Fallback to user ID 1 if not authenticated

  return (
    <div style={{ padding: "2rem", maxWidth: "100%", margin: "auto" }}>
      <div style={{ marginBottom: "1rem", padding: "1rem", background: "#f0f8ff", borderRadius: "8px" }}>
        <h2 style={{ margin: "0 0 0.5rem 0" }}>📈 Goal History Insights</h2>
        <p style={{ margin: "0", color: "#666" }}>
          Viewing data for: <strong>{user ? user.username : `User ${userId}`}</strong> (ID: {userId})
        </p>
      </div>
      <GoalHistory userId={userId} />
    </div>
  );
}
