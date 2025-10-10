import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface DiscrepancyChartProps {
  expected: number;
  perceived: number;
  actual: number;
}

export const DiscrepancyChart: React.FC<DiscrepancyChartProps> = ({ expected, perceived, actual }) => {
  const data = {
    labels: ["Goal", "Perceived", "Actual"],
    datasets: [
      {
        label: "Performance (%)",
        data: [expected, perceived, actual],
        backgroundColor: ["#4cafef", "#ffb74d", "#81c784"],
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Goal vs Perception vs Actual" },
    },
    scales: {
      y: { min: 0, max: 100 },
    },
  };

  return <Bar data={data} options={options} />;
};
