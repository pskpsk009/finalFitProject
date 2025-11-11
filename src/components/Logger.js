import React, { useState } from 'react';
import './Logger.css'; // Ensure the correct CSS file is imported

const Logger = () => {
  const [logHistory, setLogHistory] = useState([]);
  const [newLog, setNewLog] = useState({
    exercise: '',
    duration: '',
    meal: '',
    calories: '',
    weight: '',
    height: '',
    timestamp: '',
  });

  const handleAddLog = () => {
    const { exercise, duration, meal, calories, weight, height, timestamp } = newLog;

    if (!exercise || !duration || !meal || !calories || !weight || !height || !timestamp) {
      alert('Please fill in all fields.');
      return;
    }

    setLogHistory((prevLogs) => [...prevLogs, newLog]);
    setNewLog({
      exercise: '',
      duration: '',
      meal: '',
      calories: '',
      weight: '',
      height: '',
      timestamp: '',
    });
  };

  return (
    <div className="logger-container">
      <h1 className="logger-title">Fitness & Nutrition Tracker</h1>

      <div className="logger-add-log">
        <h2>Add New Log</h2>
        <input
          type="text"
          placeholder="Exercise (e.g., Running)"
          value={newLog.exercise}
          onChange={(e) => setNewLog((prev) => ({ ...prev, exercise: e.target.value }))}
          className="logger-input"
        />
        <input
          type="text"
          placeholder="Duration (e.g., 30 mins)"
          value={newLog.duration}
          onChange={(e) => setNewLog((prev) => ({ ...prev, duration: e.target.value }))}
          className="logger-input"
        />
        <input
          type="text"
          placeholder="Meal (e.g., Breakfast)"
          value={newLog.meal}
          onChange={(e) => setNewLog((prev) => ({ ...prev, meal: e.target.value }))}
          className="logger-input"
        />
        <input
          type="text"
          placeholder="Calories (e.g., 500)"
          value={newLog.calories}
          onChange={(e) => setNewLog((prev) => ({ ...prev, calories: e.target.value }))}
          className="logger-input"
        />
        <input
          type="text"
          placeholder="Weight (e.g., 70 kg)"
          value={newLog.weight}
          onChange={(e) => setNewLog((prev) => ({ ...prev, weight: e.target.value }))}
          className="logger-input"
        />
        <input
          type="text"
          placeholder="Height (e.g., 170 cm)"
          value={newLog.height}
          onChange={(e) => setNewLog((prev) => ({ ...prev, height: e.target.value }))}
          className="logger-input"
        />
        <input
          type="text"
          placeholder="Timestamp (e.g., 2023-10-01 10:00 AM)"
          value={newLog.timestamp}
          onChange={(e) => setNewLog((prev) => ({ ...prev, timestamp: e.target.value }))}
          className="logger-input"
        />
        <button onClick={handleAddLog} className="logger-button">
          Add Log
        </button>
      </div>

      <h2>Logged Items</h2>
      <div>
        {logHistory.length > 0 ? (
          logHistory.map((log, index) => (
            <div key={index} className="logger-log-item">
              <h3>Logged Data {index + 1}</h3>
              <p><strong>Exercise:</strong> {log.exercise}</p>
              <p><strong>Duration:</strong> {log.duration}</p>
              <p><strong>Meal:</strong> {log.meal}</p>
              <p><strong>Calories:</strong> {log.calories}</p>
              <p><strong>Weight:</strong> {log.weight}</p>
              <p><strong>Height:</strong> {log.height}</p>
              <p><strong>Timestamp:</strong> {log.timestamp}</p>
            </div>
          ))
        ) : (
          <p>No logged items yet.</p>
        )}
      </div>
    </div>
  );
};

export default Logger; // Ensure the component is exported as default
