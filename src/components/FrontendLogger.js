import React, { useState, useEffect } from "react";
import "./FrontendLogger.css"; // Import the CSS file for styling
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
import { Line } from "react-chartjs-2"; // Import chart library
import CaloriesBurntPage from "./CaloriesBurntPage";
import BMIProgressPage from "./BMIProgressPage";
import { saveUserProfile, loadUserProfile } from "../utils/userProfileUtils"; // Ensure both functions are imported

// Register required components for Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const FrontendLogger = ({ onComplete, onLogout, username = "User" }) => {
  // Add username prop
  const [logHistory, setLogHistory] = useState([]);
  // initialize logHistory from localStorage so data persists across navigation
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ft_log_history");
      if (raw) setLogHistory(JSON.parse(raw));
    } catch (err) {}
  }, []);
  const [data, setData] = useState({
    exercise: "",
    exerciseDuration: "",
    caloriesBurnt: "",
    meal: "",
    calories: "",
  });
  const [userProfile, setUserProfile] = useState(loadUserProfile()); // Load user profile from localStorage
  const [currentPage, setCurrentPage] = useState("main");
  const [showSidebar, setShowSidebar] = useState(false);
  const [previousPage, setPreviousPage] = useState("main"); // Track the previous page
  const [isEditing, setIsEditing] = useState(false); // State to toggle edit mode
  const [editedData, setEditedData] = useState({ weight: "", height: "" }); // Temporary state for editing
  const [showUserActivity, setShowUserActivity] = useState(false); // State to toggle user activity dropdown
  const [bmiModal, setBmiModal] = useState({
    show: false,
    oldBMI: null,
    newBMI: null,
    delta: null,
  });
  const [logModal, setLogModal] = useState({ show: false, message: "" });
  const [logCount, setLogCount] = useState(0); // Add a state to store the number of logs

  useEffect(() => {
    if (!userProfile.weight || !userProfile.height) {
      // setShowPrompt(true); // Removed logic
    } else {
      // setShowPrompt(false); // Removed logic
    }
  }, [userProfile]);

  useEffect(() => {
    const fetchProfile = async () => {
      const profile = await loadUserProfile();
      console.log("Fetched user profile:", profile); // Debugging log
      setUserProfile(profile);
    };
    fetchProfile();
  }, []);

  // Listen for profile updates and external log additions (from Home quick inputs)
  useEffect(() => {
    const onProfileUpdated = (e) => {
      const updated = e.detail || loadUserProfile();
      setUserProfile(updated);
    };

    const onAddLog = (e) => {
      // ignore addLog events that this component itself dispatched
      if (e && e.detail && e.detail.__source === "frontend") return;
      if (e && e.detail) {
        setLogHistory((prev) => {
          const next = [...prev, e.detail];
          try {
            localStorage.setItem("ft_log_history", JSON.stringify(next));
          } catch (err) {}
          return next;
        });
      }
    };

    window.addEventListener("profileUpdated", onProfileUpdated);
    window.addEventListener("addLog", onAddLog);

    return () => {
      window.removeEventListener("profileUpdated", onProfileUpdated);
      window.removeEventListener("addLog", onAddLog);
    };
  }, []);

  // Persist logHistory to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem("ft_log_history", JSON.stringify(logHistory));
    } catch (err) {}
  }, [logHistory]);

  // Utility function to get the JWT token
  const getToken = () => localStorage.getItem("token"); // Updated to use the correct key

  // Optimize fetchLogCount to avoid redundant requests
  useEffect(() => {
    let isMounted = true; // Track if the component is still mounted

    const fetchLogCount = async () => {
      if (!username) {
        console.error("Username is missing. Cannot fetch log count.");
        return;
      }

      console.log("Fetching log count for username:", username); // Debugging log

      try {
        const response = await fetch(
          `http://localhost:5004/logs/${username}/count`,
          {
            headers: {
              Authorization: `Bearer ${getToken()}`,
            },
          }
        );
        if (response.ok && isMounted) {
          const data = await response.json();
          setLogCount(data.count);
        } else {
          console.error("Failed to fetch log count from the database.");
        }
      } catch (error) {
        console.error("Error fetching log count from the database:", error);
      }
    };

    fetchLogCount();

    return () => {
      isMounted = false; // Prevent state updates if the component is unmounted
    };
  }, [username]);

  const updateBMI = (weight, height) => {
    return (weight / (height / 100) ** 2).toFixed(2);
  };

  const updateUserProfileInDB = async (username, weight, height) => {
    try {
      const response = await fetch(`http://localhost:5004/user/${username}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ weight, height }),
      });
      if (!response.ok) {
        console.error("Failed to update user profile in the database.");
      }
    } catch (error) {
      console.error("Error updating user profile in the database:", error);
    }
  };

  const fetchUpdatedUserProfile = async () => {
    try {
      const updatedProfile = await loadUserProfile();
      if (updatedProfile) {
        setUserProfile(updatedProfile);
      } else {
        console.warn("No updated profile data found.");
      }
    } catch (error) {
      console.error("Failed to fetch updated user profile:", error);
    }
  };

  const closeLogModal = () => {
    setLogModal({ show: false, message: "" });
  };

  // Debugging: Log the username and token before making requests
  console.log("Username:", username);
  console.log("Token:", getToken());

  // Debugging: Log the Authorization header before making requests
  console.log("Authorization Header:", `Bearer ${getToken()}`);

  // Replace localStorage logic with database calls for saving logs
  const saveLogToDatabase = async (log) => {
    try {
      const response = await fetch(`http://localhost:5004/logs/${username}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(log),
      });
      if (!response.ok) {
        console.error("Failed to save log to the database.");
      }
    } catch (error) {
      console.error("Error saving log to the database:", error);
    }
  };

  // Update handleExerciseLog to use saveLogToDatabase
  const handleExerciseLog = async () => {
    const caloriesBurnt = (parseFloat(data.exerciseDuration) * 8).toFixed(2);

    if (!userProfile.weight || !userProfile.height) {
      alert(
        "Weight and height are required to calculate BMI. Please update your profile."
      );
      return;
    }

    const weightLoss = (caloriesBurnt / 7700).toFixed(2);
    const updatedWeight = (
      parseFloat(userProfile.weight) - parseFloat(weightLoss)
    ).toFixed(2);
    const updatedBMI = (
      updatedWeight /
      (userProfile.height / 100) ** 2
    ).toFixed(2);

    setUserProfile((prev) => ({ ...prev, weight: updatedWeight }));

    await updateUserProfileInDB(username, updatedWeight, userProfile.height);

    const updatedLog = {
      type: "exercise",
      exercise: data.exercise,
      exerciseDuration: data.exerciseDuration,
      caloriesBurnt: caloriesBurnt,
      bmi: updatedBMI,
      timestamp: new Date().toISOString(),
    };

    await saveLogToDatabase(updatedLog);
    await fetchUpdatedUserProfile();

    // Update local state and notify other components that a log was added
    try {
      setLogHistory((prev) => {
        const next = [...prev, updatedLog];
        try {
          localStorage.setItem("ft_log_history", JSON.stringify(next));
        } catch (err) {}
        return next;
      });
      window.dispatchEvent(
        new CustomEvent("addLog", {
          detail: { ...updatedLog, __source: "frontend" },
        })
      );
    } catch (err) {
      console.error("Error updating local log history:", err);
    }

    setData((prevData) => ({
      ...prevData,
      exercise: "",
      exerciseDuration: "",
    }));

    setLogModal({
      show: true,
      message: `Exercise log saved successfully!\nCalories Burnt: ${caloriesBurnt} kcal\nUpdated BMI: ${updatedBMI}`,
    });
  };

  // Update handleMealLog to use saveLogToDatabase
  const handleMealLog = async () => {
    const caloriesIntake = parseFloat(data.calories) || 0;

    if (!userProfile.weight || !userProfile.height) {
      alert(
        "Weight and height are required to calculate BMI. Please update your profile."
      );
      return;
    }

    const weightGain = (caloriesIntake / 7700).toFixed(2);
    const updatedWeight = (
      parseFloat(userProfile.weight) + parseFloat(weightGain)
    ).toFixed(2);
    const updatedBMI = (
      updatedWeight /
      (userProfile.height / 100) ** 2
    ).toFixed(2);

    setUserProfile((prev) => ({ ...prev, weight: updatedWeight }));

    await updateUserProfileInDB(username, updatedWeight, userProfile.height);

    const updatedLog = {
      type: "meal",
      meal: data.meal,
      mealTime: new Date().toLocaleTimeString(),
      caloriesIntake: caloriesIntake,
      bmi: updatedBMI,
      timestamp: new Date().toISOString(),
    };

    await saveLogToDatabase(updatedLog);
    await fetchUpdatedUserProfile();

    // Update local state and notify other components that a log was added
    try {
      setLogHistory((prev) => {
        const next = [...prev, updatedLog];
        try {
          localStorage.setItem("ft_log_history", JSON.stringify(next));
        } catch (err) {}
        return next;
      });
      window.dispatchEvent(
        new CustomEvent("addLog", {
          detail: { ...updatedLog, __source: "frontend" },
        })
      );
    } catch (err) {
      console.error("Error updating local log history:", err);
    }

    setData((prevData) => ({
      ...prevData,
      meal: "",
      calories: "",
    }));

    setLogModal({
      show: true,
      message: `Meal log saved successfully!\nCalories Intake: ${caloriesIntake} kcal\nUpdated BMI: ${updatedBMI}`,
    });
  };

  const closeBmiModal = () => {
    setBmiModal({ show: false, oldBMI: null, newBMI: null, delta: null });
  };

  // Prepare data for the charts
  const chartData = {
    labels: logHistory.map((log) => log.timestamp || "Unknown"),
    datasets: [
      {
        label: "Calories Tracking",
        data: logHistory.map((log) => {
          if (log.type === "exercise") {
            return -parseFloat(log.caloriesBurnt) || 0; // Negative for calories burnt
          } else if (log.type === "meal") {
            return parseFloat(log.caloriesIntake) || 0; // Positive for calories intake
          }
          return 0;
        }),
        borderColor: "#3B82F6",
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        fill: true,
      },
      {
        label: "BMI Progress",
        data: logHistory.map((_, index) => {
          const initialWeight = parseFloat(userProfile.weight);
          const cumulativeCalories = logHistory
            .slice(0, index + 1)
            .reduce((sum, log) => {
              if (log.type === "exercise") {
                return sum - (parseFloat(log.caloriesBurnt) || 0);
              } else if (log.type === "meal") {
                return sum + (parseFloat(log.caloriesIntake) || 0);
              }
              return sum;
            }, 0);
          const weight = initialWeight + cumulativeCalories / 7700; // Adjust weight based on cumulative calories
          return weight && userProfile.height
            ? (weight / (userProfile.height / 100) ** 2).toFixed(2)
            : null;
        }),
        borderColor: "#10B981",
        backgroundColor: "rgba(16, 185, 129, 0.2)",
        fill: true,
      },
    ],
  };

  const calculateRecommendations = () => {
    if (logHistory.length === 0)
      return "No data available for recommendations.";

    const totalCaloriesChange = logHistory.reduce((sum, log) => {
      if (log.type === "exercise") {
        return sum - (parseFloat(log.caloriesBurnt) || 0);
      } else if (log.type === "meal") {
        return sum + (parseFloat(log.caloriesIntake) || 0);
      }
      return sum;
    }, 0);

    const currentWeight =
      parseFloat(userProfile.weight) + totalCaloriesChange / 7700;
    const currentBMI =
      currentWeight && userProfile.height
        ? (currentWeight / (userProfile.height / 100) ** 2).toFixed(2)
        : null;

    let recommendation = "Keep up the good work!";
    if (currentBMI > 25) {
      recommendation =
        "Consider reducing calorie intake and increasing physical activity.";
    } else if (currentBMI < 18.5) {
      recommendation =
        "Consider increasing calorie intake with a balanced diet.";
    }

    return `Current BMI: ${
      currentBMI || "N/A"
    }\nRecommendation: ${recommendation}`;
  };

  const calculateCaloriesRecommendations = () => {
    if (logHistory.length === 0)
      return "No data available for recommendations.";

    const totalCaloriesBurnt = logHistory.reduce((sum, log) => {
      if (log.type === "exercise") {
        return sum + (parseFloat(log.caloriesBurnt) || 0);
      }
      return sum;
    }, 0);

    const totalCaloriesIntake = logHistory.reduce((sum, log) => {
      if (log.type === "meal") {
        return sum + (parseFloat(log.caloriesIntake) || 0);
      }
      return sum;
    }, 0);

    const calorieBalance = totalCaloriesIntake - totalCaloriesBurnt;

    let recommendation = "Your calorie balance is on track!";
    if (calorieBalance > 500) {
      recommendation =
        "Consider reducing your calorie intake or increasing physical activity.";
    } else if (calorieBalance < -500) {
      recommendation =
        "Consider increasing your calorie intake to maintain energy levels.";
    }

    return (
      `Total Calories Burnt: ${totalCaloriesBurnt.toFixed(2)} kcal\n` +
      `Total Calories Intake: ${totalCaloriesIntake.toFixed(2)} kcal\n` +
      `Calorie Balance: ${calorieBalance.toFixed(2)} kcal\n` +
      `Recommendation: ${recommendation}`
    );
  };

  const lastLog = logHistory[logHistory.length - 1] || data; // Use the last log or fallback to default data

  const handleMenuToggle = () => {
    setPreviousPage(currentPage); // Save the current page as the previous page
    setShowSidebar((prev) => !prev); // Toggle the sidebar
  };

  const handleGoBack = () => {
    if (showSidebar) {
      setShowSidebar(false); // Close the sidebar
    } else {
      setCurrentPage(previousPage); // Navigate back to the previous page
    }
  };

  // profile edit/save UI removed (handled in left panel). Helper functions removed.

  if (currentPage === "caloriesBurnt") {
    return (
      <CaloriesBurntPage
        chartData={chartData}
        onGoBack={handleGoBack}
        recommendations={calculateCaloriesRecommendations()} // Pass calorie-specific recommendations
      />
    );
  }

  if (currentPage === "bmiProgress") {
    return (
      <BMIProgressPage
        chartData={chartData}
        onGoBack={handleGoBack}
        recommendations={calculateRecommendations()}
      />
    );
  }

  return (
    <div className="logger-container">
      {/* Log Modal */}
      {logModal.show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 18,
              borderRadius: 8,
              width: 360,
              boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>Log Update</h3>
            <p style={{ whiteSpace: "pre-wrap" }}>{logModal.message}</p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <button
                onClick={closeLogModal}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#3B82F6",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* BMI change modal */}
      {bmiModal.show && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: "#fff",
              padding: 18,
              borderRadius: 8,
              width: 360,
              boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
            }}
          >
            <h3 style={{ marginTop: 0 }}>BMI Update</h3>
            <p style={{ marginBottom: 6 }}>
              {bmiModal.delta > 0 ? (
                <>
                  Your BMI increased by{" "}
                  <strong>{String(bmiModal.delta)}</strong>.
                </>
              ) : bmiModal.delta < 0 ? (
                <>
                  Your BMI decreased by{" "}
                  <strong>{String(Math.abs(bmiModal.delta))}</strong>.
                </>
              ) : (
                <>Your BMI did not change.</>
              )}
            </p>
            <p style={{ color: "#555", marginTop: 6 }}>
              From <strong>{Number(bmiModal.oldBMI).toFixed(2)}</strong> to{" "}
              <strong>{Number(bmiModal.newBMI).toFixed(2)}</strong>
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                marginTop: 12,
              }}
            >
              <button
                onClick={closeBmiModal}
                style={{
                  padding: "8px 12px",
                  borderRadius: 6,
                  border: "none",
                  background: "#3B82F6",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar (toggled via other UI; floating menu removed) */}
      {showSidebar && (
        <div className="sidebar">
          <button className="sidebar-button" onClick={handleGoBack}>
            Go Back
          </button>
          <h2>Dashboard</h2>
          <div className="sidebar-section">
            <h3
              className="user-activity-header"
              onClick={() => setShowUserActivity((prev) => !prev)} // Toggle user activity dropdown
              style={{
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              User Activity
              <span>{showUserActivity ? "▲" : "▼"}</span>{" "}
              {/* Arrow indicator */}
            </h3>
            {showUserActivity && ( // Conditionally render the dropdown content
              <ul>
                {logHistory.map((log, index) => (
                  <li key={index}>
                    {log.timestamp}:{" "}
                    {log.type === "exercise" ? (
                      <>
                        {log.exercise} for {log.exerciseDuration} mins
                      </>
                    ) : (
                      <>
                        {log.meal} at {log.mealTime}
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="sidebar-section">
            <button
              className="sidebar-chart-button"
              onClick={() => setCurrentPage("caloriesBurnt")}
            >
              View Calories Burnt Chart
            </button>
            <button
              className="sidebar-chart-button"
              onClick={() => setCurrentPage("bmiProgress")}
            >
              View BMI Progress Chart
            </button>
          </div>
        </div>
      )}

      {/* User profile floating button removed from Features view */}

      <div className="card">
        <h1>Fitness & Nutrition Tracker</h1>

        {/* Section 1: Exercise Logging */}
        <h2>Log Exercise</h2>
        <div className="input-grid">
          <input
            type="text"
            placeholder="Exercise"
            value={data.exercise}
            onChange={(e) =>
              setData((prev) => ({ ...prev, exercise: e.target.value }))
            }
          />
          <input
            type="number"
            placeholder="Exercise Duration (minutes)"
            value={data.exerciseDuration}
            onChange={(e) =>
              setData((prev) => ({ ...prev, exerciseDuration: e.target.value }))
            }
          />
        </div>
        <p>
          Calories Burnt: {(parseFloat(data.exerciseDuration) * 8).toFixed(2)}{" "}
          kcal
        </p>
        <button className="save-button" onClick={handleExerciseLog}>
          Save Exercise Log
        </button>

        {/* Section 2: Meal Logging */}
        <h2>Log Meal</h2>
        <div className="input-grid">
          <input
            type="text"
            placeholder="Meal"
            value={data.meal}
            onChange={(e) =>
              setData((prev) => ({ ...prev, meal: e.target.value }))
            }
          />
          <input
            type="number"
            placeholder="Calories"
            value={data.calories}
            onChange={(e) =>
              setData((prev) => ({ ...prev, calories: e.target.value }))
            }
          />
        </div>
        <p>Calories Intake: {parseFloat(data.calories) || 0} kcal</p>
        <button className="save-button" onClick={handleMealLog}>
          Save Meal Log
        </button>

        {/* Logged Data list removed from Features to keep feature tab focused */}
      </div>
    </div>
  );
};

export default FrontendLogger;
