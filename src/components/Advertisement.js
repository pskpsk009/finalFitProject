import React from "react";
import "./Advertisement.css"; // Import CSS for styling
import Login from "./Login";

const Advertisement = ({ onLogin }) => {
  return (
    <div className="advertisement-container">
      <h1 className="advertisement-title">
        Welcome to Fitness & Nutrition Tracker
      </h1>
      <p className="advertisement-description">
        Track your fitness progress and maintain a healthy lifestyle with our
        app.
      </p>
      {/* Login placed directly above the images */}
      <div
        className="login-wrapper"
        style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}
      >
        <Login onLogin={onLogin} />
      </div>
      <div className="advertisement-section">
        <div className="advertisement-item">
          <img
            src="https://hips.hearstapps.com/hmg-prod/images/701/articles/2017/01/how-much-joining-gym-helps-health-2-jpg-1488906648.jpeg"
            alt="Exercise"
            className="advertisement-image"
          />
          <p>Stay active with regular exercise.</p>
        </div>
        <div className="advertisement-item">
          <img
            src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQL-AdJgfVZWFIfsYSvj12YvRqFjZohkzFZQQ&s"
            alt="Nutrition"
            className="advertisement-image"
          />
          <p>Maintain a balanced diet for better health.</p>
        </div>
      </div>
    </div>
  );
};

export default Advertisement;
