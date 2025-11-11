import React from 'react';
import { Line } from 'react-chartjs-2';
import './FullScreenPage.css'; // Shared CSS for full-screen pages

const CaloriesBurntPage = ({ chartData, onGoBack, recommendations }) => {
  if (!chartData || !chartData.labels || !chartData.datasets) {
    return <p>No data available for the chart.</p>; // Handle missing or invalid data
  }

  return (
    <div className="full-screen-page">
      <button className="go-back-button" onClick={onGoBack}>
        Go Back
      </button>
      <h1>Calories Tracking</h1>
      <div className="chart-container">
        <Line data={chartData} options={{ responsive: true, maintainAspectRatio: false }} />
      </div>
      <div className="recommendations">
        <h2>Calories Recommendations</h2>
        <p>{recommendations}</p>
      </div>
    </div>
  );
};

export default CaloriesBurntPage;
