import React, { useState, useEffect } from "react";
import FrontendLogger from "./FrontendLogger";
import History from "./History";
import Charts from "./Charts";
import { authenticatedFetch } from "../utils/userProfileUtils";

const fetchUserProfile = async (username) => {
  const response = await authenticatedFetch(
    `http://localhost:5004/user/${username}`
  );
  if (response && response.ok) {
    const data = await response.json();
    return data.data;
  }
  console.error("Failed to fetch user profile.");
  return null;
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-start",
  padding: "8px 12px",
  borderBottom: "1px solid var(--border)",
  background: "var(--card-bg)",
  position: "sticky",
  top: 0,
  left: 0,
  zIndex: 60,
};

const brandStyle = {
  fontWeight: 700,
  fontSize: 20,
  color: "var(--text)",
};

const navStyle = {
  display: "flex",
  gap: 10,
  marginLeft: 12,
};

const buttonStyle = (active) => ({
  padding: "8px 14px",
  borderRadius: 6,
  border: active ? "2px solid #2563eb" : "1px solid #d1d5db",
  background: active ? "#eff6ff" : "#ffffff",
  cursor: "pointer",
});

const mainStyle = {
  display: "flex",
  gap: 16,
  padding: 0,
  alignItems: "flex-start",
};

export default function Home({ onComplete, onLogout, onGoBack }) {
  const [active, setActive] = useState("features");
  const [userProfile, setUserProfile] = useState({
    username: "",
    weight: null,
    height: null,
  });
  const [logs, setLogs] = useState([]);
  const [localRecordCount, setLocalRecordCount] = useState(0);

  useEffect(() => {
    const loadProfile = async () => {
      const profile = await fetchUserProfile("User"); // Replace "User" with the logged-in username
      if (profile) {
        setUserProfile(profile);
      }
    };
    loadProfile();
  }, []);

  useEffect(() => {
    if (userProfile.weight && userProfile.height) {
      const bmi = (
        userProfile.weight /
        (userProfile.height / 100) ** 2
      ).toFixed(2);
      setUserProfile((prev) => ({ ...prev, bmi }));
    }
  }, [userProfile.weight, userProfile.height]);

  // Add a check to ensure username is valid before making the request
  useEffect(() => {
    const fetchLogs = async () => {
      if (!userProfile.username) {
        console.error("Username is missing. Cannot fetch logs.");
        return;
      }

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
          setLogs(Array.isArray(data.data) ? data.data : []); // Ensure data is an array
        } else {
          console.error("Failed to fetch logs from the database.");
        }
      } catch (error) {
        console.error("Error fetching logs from the database:", error);
      }
    };

    fetchLogs();
  }, [userProfile.username]);

  // Track localStorage ft_log_history changes so the Profile card updates immediately
  // and refresh the logs list when items are added/removed.
  useEffect(() => {
    const readCount = () => {
      try {
        const raw = localStorage.getItem("ft_log_history");
        const arr = raw ? JSON.parse(raw) : [];
        setLocalRecordCount(Array.isArray(arr) ? arr.length : 0);
      } catch (e) {
        setLocalRecordCount(0);
      }
    };

    const fetchLogsFromServer = async () => {
      if (!userProfile || !userProfile.username) return;
      try {
        const res = await fetch(
          `http://localhost:5004/logs/${userProfile.username}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        if (res.ok) {
          const d = await res.json();
          setLogs(Array.isArray(d.data) ? d.data : []);
        }
      } catch (err) {
        // ignore fetch errors here
      }
    };

    // initialize
    readCount();
    // also ensure logs are in sync when profile appears
    fetchLogsFromServer();

    // Listen for custom events other components may dispatch
    const onAddLog = () => {
      readCount();
      fetchLogsFromServer();
    };
    const onLogsDeleted = () => {
      readCount();
      fetchLogsFromServer();
    };
    const onStorage = (e) => {
      if (e.key === "ft_log_history") {
        readCount();
        fetchLogsFromServer();
      }
    };

    window.addEventListener("addLog", onAddLog);
    window.addEventListener("logsDeleted", onLogsDeleted);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("addLog", onAddLog);
      window.removeEventListener("logsDeleted", onLogsDeleted);
      window.removeEventListener("storage", onStorage);
    };
  }, [userProfile && userProfile.username]);

  return (
    <div
      style={{
        fontFamily: "Arial, sans-serif",
        width: "100%",
        margin: 0,
        padding: "0 12px 12px 12px",
      }}
    >
      <header style={headerStyle}>
        <div style={brandStyle}>Fit-Track</div>
        <nav style={navStyle} aria-label="Main navigation">
          <button
            style={buttonStyle(active === "features")}
            onClick={() => setActive("features")}
          >
            Features
          </button>
          <button
            style={buttonStyle(active === "history")}
            onClick={() => setActive("history")}
          >
            History
          </button>
          <button
            style={buttonStyle(active === "charts")}
            onClick={() => setActive("charts")}
          >
            Charts
          </button>
          <button
            style={buttonStyle(active === "profile")}
            onClick={() => setActive("profile")}
          >
            Profile
          </button>
        </nav>
      </header>

      <main style={mainStyle}>
        {active === "features" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr 300px",
              gap: 12,
              width: "100%",
              alignItems: "start",
            }}
          >
            {/* Left: Profile */}
            <aside
              style={{ padding: "8px 16px", alignSelf: "start", marginTop: 30 }}
            >
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: 20,
                  borderRadius: 10,
                  boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                  minHeight: 220,
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "6px 0",
                      paddingLeft: 30,
                      lineHeight: 1.8,
                    }}
                  >
                    <strong>Username:</strong> {userProfile.username || "User"}
                  </p>
                  <p
                    style={{
                      margin: "6px 0",
                      paddingLeft: 30,
                      lineHeight: 1.8,
                    }}
                  >
                    <strong>Weight:</strong>{" "}
                    {userProfile.weight ? `${userProfile.weight} kg` : "N/A"}
                  </p>
                  <p
                    style={{
                      margin: "6px 0",
                      paddingLeft: 30,
                      lineHeight: 1.8,
                    }}
                  >
                    <strong>Height:</strong>{" "}
                    {userProfile.height ? `${userProfile.height} cm` : "N/A"}
                  </p>
                  <p
                    style={{
                      margin: "6px 0",
                      paddingLeft: 30,
                      lineHeight: 1.8,
                    }}
                  >
                    <strong>BMI:</strong> {userProfile.bmi ?? "N/A"}
                  </p>
                </div>
              </div>
            </aside>

            {/* Center: Logger */}
            <section
              style={{
                padding: 0,
                alignSelf: "start",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <div style={{ width: "100%", maxWidth: 760, marginTop: 36 }}>
                <FrontendLogger
                  onComplete={onComplete}
                  onLogout={onLogout}
                  onGoBack={onGoBack}
                  username={userProfile.username} // Pass the username from userProfile
                />
              </div>
            </section>

            {/* Right: Activity */}
            <aside
              style={{ padding: "8px 16px", alignSelf: "start", marginTop: 30 }}
            >
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: 20,
                  borderRadius: 12,
                  boxShadow: "0 6px 18px rgba(16,24,40,0.06)",
                  minHeight: 240,
                }}
              >
                <h3 style={{ color: "var(--heading)", marginTop: 0 }}>
                  User Activity
                </h3>
                <div
                  style={{ maxHeight: 520, overflowY: "auto", paddingRight: 6 }}
                >
                  {(() => {
                    try {
                      if (!logs || logs.length === 0)
                        return (
                          <p
                            style={{
                              color: "var(--muted-text)",
                              lineHeight: 1.8,
                            }}
                          >
                            No activity yet.
                          </p>
                        );
                      return (
                        <ul
                          style={{ listStyle: "none", padding: 0, margin: 0 }}
                        >
                          {logs
                            .slice()
                            .reverse()
                            .map((log, index) => (
                              <li
                                key={index}
                                style={{
                                  padding: "14px 10px",
                                  borderBottom: "1px solid var(--border)",
                                  lineHeight: 1.6,
                                }}
                              >
                                <div
                                  style={{
                                    fontSize: 12,
                                    color: "var(--muted-text)",
                                    marginBottom: 6,
                                  }}
                                >
                                  {log.timestamp || "Unknown timestamp"}
                                </div>
                                <div
                                  style={{ fontSize: 13, color: "var(--text)" }}
                                >
                                  {log.type === "exercise"
                                    ? `${
                                        log.exercise || "Unknown exercise"
                                      } for ${
                                        log.exerciseDuration ||
                                        "Unknown duration"
                                      } mins`
                                    : log.type === "meal"
                                    ? `${log.meal || "Unknown meal"} at ${
                                        log.mealTime || "Unknown time"
                                      }`
                                    : log.value || "Unknown activity"}
                                </div>
                              </li>
                            ))}
                        </ul>
                      );
                    } catch (err) {
                      return (
                        <p
                          style={{
                            color: "var(--muted-text)",
                            lineHeight: 1.8,
                          }}
                        >
                          No activity yet.
                        </p>
                      );
                    }
                  })()}
                </div>
              </div>
            </aside>
          </div>
        )}

        {active === "history" && <History username={userProfile.username} />}
        {active === "charts" && <Charts />}
        {active === "profile" && (
          <div style={{ padding: 18 }}>
            <h2 style={{ color: "var(--heading)", marginLeft: 300 }}>
              Profile
            </h2>
            <div
              style={{
                display: "flex",
                gap: 16,
                alignItems: "flex-start",
                marginTop: 40,
                marginLeft: 230,
              }}
            >
              <div
                style={{
                  background: "var(--card-bg)",
                  padding: 14,
                  borderRadius: 10,
                  boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                  minWidth: 240,
                }}
              >
                <p style={{ margin: "6px 0" }}>
                  <strong>Username:</strong> {userProfile.username || "User"}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>Latest BMI:</strong>{" "}
                  {(() => {
                    try {
                      if (userProfile && userProfile.bmi)
                        return userProfile.bmi;
                      const raw = localStorage.getItem("ft_log_history");
                      const arr = raw ? JSON.parse(raw) : [];
                      for (let i = arr.length - 1; i >= 0; i--)
                        if (arr[i].type === "bmi")
                          return String(arr[i].value).replace("BMI: ", "");
                    } catch (e) {}
                    return "N/A";
                  })()}
                </p>
                <p style={{ margin: "6px 0" }}>
                  <strong>Number of records:</strong> {localRecordCount}
                </p>
                <div style={{ marginTop: 12 }}>
                  <button
                    onClick={() => {
                      if (typeof onLogout === "function") onLogout();
                    }}
                    aria-label="Log Out"
                    style={{
                      background: "var(--danger, #ef4444)",
                      color: "#fff",
                      border: "none",
                      padding: "8px 12px",
                      borderRadius: 6,
                      cursor: "pointer",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.12)",
                      zIndex: 20,
                      fontWeight: 600,
                      display: "inline-block",
                    }}
                  >
                    Log Out
                  </button>
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <p style={{ color: "var(--muted-text)" }}>
                  Use the Features → Profile area to edit your profile
                  (weight/height) and record BMI entries.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
