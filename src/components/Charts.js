import React, { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { loadUserProfile } from "../utils/userProfileUtils";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Separate charts for Calories and BMI
const Charts = () => {
  const [logs, setLogs] = useState([]);
  const [userProfile, setUserProfile] = useState(null);

  // Ensure userProfile is resolved before being used
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await loadUserProfile(); // Resolve the promise
        setUserProfile(profile);
      } catch (error) {
        console.error("Failed to load user profile:", error);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    if (!userProfile || !userProfile.username) {
      console.error("Username is missing in userProfile:", userProfile); // Debugging log
      return;
    }

    const fetchLogs = async () => {
      try {
        const response = await fetch(
          `http://localhost:5004/logs/${userProfile.username}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (response.ok) {
          const data = await response.json();
          setLogs(Array.isArray(data.data) ? data.data : []);
        } else {
          console.error("Failed to fetch logs from the database.");
        }
      } catch (error) {
        console.error("Error fetching logs from the database:", error);
      }
    };

    fetchLogs();
  }, [userProfile]);

  // Adjust chart options to ensure negative values fit within the chart borders
  const caloriesChartData = React.useMemo(() => {
    const labels = logs.map((log) => log.timestamp || "Unknown");
    const caloriesDataset = logs.map((log) => {
      if (log.type === "exercise") {
        return -(Number(log.caloriesBurnt) || 0); // Subtract calories burnt
      }
      if (log.type === "meal") {
        return Number(log.caloriesIntake) || 0; // Add calories intake
      }
      return 0;
    });

    return {
      labels,
      datasets: [
        {
          label: "Net Calories (Intake - Burnt)",
          data: caloriesDataset,
          borderColor: "#3B82F6",
          backgroundColor: "rgba(59, 130, 246, 0.2)",
          fill: true,
        },
      ],
    };
  }, [logs]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          maxRotation: 0, // Prevent overlapping of X-axis labels
          minRotation: 0,
        },
      },
      y: {
        beginAtZero: true, // Ensure Y-axis starts at zero
        grace: "10%", // Add padding to prevent values from touching the border
      },
    },
  };

  const calculateBMIRecommendations = () => {
    if (!userProfile || !userProfile.height || !userProfile.weight) {
      return <p>No BMI data available for recommendations.</p>;
    }

    const bmi = Number(
      (userProfile.weight / (userProfile.height / 100) ** 2).toFixed(2)
    );

    let recommendation = "Your BMI is within the normal range.";
    if (bmi < 18.5) {
      recommendation =
        "Your BMI indicates you are underweight. Consider consulting a nutritionist.";
    } else if (bmi >= 25) {
      recommendation =
        "Your BMI indicates you are overweight. Consider a balanced diet and regular exercise.";
    }

    return (
      <div>
        <p>
          <strong>Current BMI:</strong> {bmi}
        </p>
        <p>
          <strong>Recommendation:</strong> {recommendation}
        </p>
      </div>
    );
  };

  // Ensure calories burnt and intake are calculated and displayed separately
  const calculateCaloriesRecommendations = () => {
    if (!logs || logs.length === 0) {
      return (
        <div>
          <p>
            No calorie data available. Please log your activities and meals to
            see recommendations.
          </p>
        </div>
      );
    }

    const totalCaloriesBurnt = logs.reduce((sum, log) => {
      if (log.type === "exercise") {
        return sum + (Number(log.caloriesBurnt) || 0); // Ensure proper addition
      }
      return sum;
    }, 0);

    const totalCaloriesIntake = logs.reduce((sum, log) => {
      if (log.type === "meal") {
        return sum + (Number(log.caloriesIntake) || 0); // Ensure proper addition
      }
      return sum;
    }, 0);

    const netCalories = totalCaloriesIntake - totalCaloriesBurnt; // Net calories for chart calculations

    let recommendation = "Your calorie balance is healthy.";
    if (netCalories < 0) {
      recommendation =
        "You are burning more calories than you are consuming. Ensure you are eating enough to sustain your energy levels.";
    } else if (netCalories > 0) {
      recommendation =
        "You are consuming more calories than you are burning. Consider increasing your physical activity.";
    }

    return (
      <div>
        <p>
          <strong>Total Calories Burnt:</strong>{" "}
          {parseInt(totalCaloriesBurnt, 10)}
        </p>
        <p>
          <strong>Total Calories Intake:</strong>{" "}
          {parseInt(totalCaloriesIntake, 10)}
        </p>
        <p>
          <strong>Recommendation:</strong> {recommendation}
        </p>
      </div>
    );
  };

  return (
    <div style={{ padding: 18 }}>
      <h1 style={{ textAlign: "center", color: "#1e40af", marginBottom: 24 }}>
        Charts
      </h1>

      {/* Main layout: chart on the left, recommendations stacked on the right */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "flex-start",
          marginBottom: 24,
        }}
      >
        <div
          style={{
            flex: 2,
            minWidth: 0,
            height: 420,
            background: "#fff",
            padding: 12,
            borderRadius: 8,
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
            overflow: "hidden",
          }}
        >
          <h2
            style={{ textAlign: "center", color: "#1e40af", marginBottom: 12 }}
          >
            Calories Chart
          </h2>
          <div style={{ height: "calc(100% - 44px)" }}>
            <Line data={caloriesChartData} options={chartOptions} />
          </div>
        </div>

        <div
          style={{
            flex: 1,
            minWidth: 260,
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
              padding: 12,
              background: "#f9f9f9",
              borderRadius: 8,
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              overflow: "auto",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                color: "#1e40af",
                marginBottom: 12,
              }}
            >
              Calories Recommendations
            </h2>
            <div style={{ textAlign: "left" }}>
              {calculateCaloriesRecommendations()}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              padding: 12,
              background: "#f9f9f9",
              borderRadius: 8,
              boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              overflow: "auto",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                color: "#1e40af",
                marginBottom: 12,
              }}
            >
              BMI Recommendations
            </h2>
            <div style={{ textAlign: "left" }}>
              {calculateBMIRecommendations()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Charts;
