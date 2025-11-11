import React, { useEffect, useState } from "react";

// Utility function to get the JWT token
const getToken = () => localStorage.getItem("token");

function History({ username }) {
  const [logs, setLogs] = useState([]); // Ensure logs is initialized as an empty array
  const [selected, setSelected] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Fetch updated user profile after fetching logs
  const fetchUpdatedUserProfile = async () => {
    try {
      const response = await fetch(`http://localhost:5004/user/${username}`, {
        headers: {
          Authorization: `Bearer ${getToken()}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Updated user profile fetched:", data);
        window.dispatchEvent(
          new CustomEvent("profileUpdated", { detail: data.data })
        );
      } else {
        console.error("Failed to fetch updated user profile.");
      }
    } catch (error) {
      console.error("Error fetching updated user profile:", error);
    }
  };

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`http://localhost:5004/logs/${username}`, {
          headers: {
            Authorization: `Bearer ${getToken()}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setLogs(Array.isArray(data.data) ? data.data : []); // Ensure data is an array
          await fetchUpdatedUserProfile(); // Fetch updated user profile
        } else {
          console.error("Failed to fetch logs from the database.");
        }
      } catch (error) {
        console.error("Error fetching logs from the database:", error);
      }
    };

    fetchLogs();
  }, [username]);

  const toggleSelect = (index) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      setSelectAll(next.size === logs.length && logs.length > 0);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(logs.map((_, i) => i)));
      setSelectAll(true);
    }
  };

  const deleteSelected = () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected item(s)?`)) return;
    const toRemove = new Set(selected);
    const remaining = logs.filter((_, i) => !toRemove.has(i));
    const deleted = logs.filter((_, i) => toRemove.has(i));
    setLogs(remaining);
    setSelected(new Set());
    setSelectAll(false);
    try {
      window.dispatchEvent(
        new CustomEvent("logsDeleted", { detail: { deleted } })
      );
    } catch (err) {}
  };

  const deleteSingle = (index) => {
    if (!window.confirm("Delete this log entry?")) return;
    const remaining = logs.filter((_, i) => i !== index);
    const deleted = [logs[index]];
    setLogs(remaining);
    setSelected((prev) => {
      const next = new Set(Array.from(prev).filter((i) => i !== index));
      setSelectAll(next.size === remaining.length && remaining.length > 0);
      return next;
    });
    try {
      window.dispatchEvent(
        new CustomEvent("logsDeleted", { detail: { deleted } })
      );
    } catch (err) {}
  };

  const buildLabel = (log, i) => {
    try {
      if (log.type === "exercise") {
        return `${log.exercise || "Exercise"} for ${
          log.exerciseDuration || "?"
        } mins`;
      } else if (log.type === "meal") {
        return `${log.meal || "Meal"}${
          log.mealTime ? ` at ${log.mealTime}` : ""
        }`;
      } else if (log.type === "bmi") {
        const v = log.value ? String(log.value).replace("BMI: ", "") : "BMI";
        return `BMI: ${v}`;
      }
      return log.value || `Log ${i + 1}`;
    } catch (e) {
      return `Log ${i + 1}`;
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center", // center the inner content horizontally
        }}
      >
        <div style={{ flex: "0 1 900px", maxWidth: 900, width: "100%" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              width: "100%",
            }}
          >
            <h2
              style={{
                textAlign: "center",
                color: "var(--heading)",
                margin: 0,
                marginLeft: 400,
                marginTop: 20,
                color: "#1e40af",
              }}
            >
              Logged Data
            </h2>
          </div>

          <div
            style={{
              marginTop: 20,
              marginLeft: 450,
              display: "flex",
              gap: 8,
              justifyContent: "center",
              width: "100%",
            }}
          >
            <button onClick={handleSelectAll}>
              {selectAll ? "Unselect All" : "Select All"}
            </button>
            <button
              onClick={deleteSelected}
              disabled={selected.size === 0}
              style={{ marginLeft: 8 }}
            >
              Delete Selected
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
          marginTop: 16,
          alignItems: "center", // center each log row horizontally
        }}
      >
        {logs.length === 0 && <p>No logged data yet.</p>}

        {logs.map((log, idx) => (
          <div
            id={`log-${idx}`}
            key={idx}
            style={{
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
              width: "100%",
            }}
          >
            {/* data box */}
            <div
              style={{
                background: "var(--panel-bg)",
                padding: 16,
                borderRadius: 8,
                flex: 1,
                marginLeft: 390,
              }}
            >
              <p>
                <strong>Timestamp:</strong> {log.timestamp || "Unknown timestamp"}
              </p>
              {log.type === "exercise" && (
                <>
                  <p>
                    <strong>Exercise Type:</strong> {log.exercise || "Unknown exercise"}
                  </p>
                  <p>
                    <strong>Exercise Duration:</strong> {log.exerciseDuration || "Unknown duration"} mins
                  </p>
                  <p>
                    <strong>Calories Burnt:</strong> {log.caloriesBurnt || "Unknown"} kcal
                  </p>
                </>
              )}
              {log.type === "meal" && (
                <>
                  <p>
                    <strong>Meal Type:</strong> {log.meal || "Unknown meal"}
                  </p>
                  <p>
                    <strong>Meal Time:</strong> {log.mealTime || "Unknown time"}
                  </p>
                  <p>
                    <strong>Calories Intake:</strong> {log.caloriesIntake || "Unknown"} kcal
                  </p>
                </>
              )}
              {log.type === "bmi" && (
                <p>
                  <strong>BMI:</strong> {log.value ? String(log.value).replace("BMI: ", "") : "-"}
                </p>
              )}
            </div>
            {/* controls to the right of the data, displayed side-by-side */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                gap: 8,
                marginTop: 30,
                marginLeft: 200,
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(idx)}
                onChange={() => toggleSelect(idx)}
                aria-label={`Select log ${idx + 1}`}
                style={{ width: 18, height: 18 }}
              />
              <button
                type="button"
                onClick={() => deleteSingle(idx)}
                aria-label={`Delete log ${idx + 1}`}
                style={{
                  background: "var(--danger, #ef4444)",
                  color: "#fff",
                  border: "none",
                  padding: "6px 10px",
                  borderRadius: 6,
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                  zIndex: 20,
                  fontWeight: 600,
                  display: "inline-block",
                }}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default History;
