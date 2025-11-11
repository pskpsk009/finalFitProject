import React from 'react';

function ExerciseDurationForm({ log, setLog }) {
  const handleLogExercise = (event) => {
    event.preventDefault();
    const exerciseType = event.target.elements.exerciseType.value;
    const duration = event.target.elements.exerciseDuration.value;
    if (exerciseType && duration) {
      setLog((prevLog) => [
        ...prevLog,
        { type: 'Exercise', details: `${exerciseType}: ${duration} mins` }
      ]);
      event.target.reset(); // Clear the form
    }
  };

  return (
    <div>
      <form onSubmit={handleLogExercise}>
        <label htmlFor="exercise-type" className="exercise-duration-label">
          Select Exercise Type:
        </label>
        <select id="exercise-type" name="exerciseType" className="exercise-duration-input">
          <option value="Running">Running</option>
          <option value="Cycling">Cycling</option>
          <option value="Swimming">Swimming</option>
          <option value="Walking">Walking</option>
        </select>

        <label htmlFor="exercise-duration" className="exercise-duration-label">
          Enter Exercise Duration (minutes):
        </label>
        <input
          type="number"
          id="exercise-duration"
          name="exerciseDuration"
          className="exercise-duration-input"
          placeholder="e.g., 30"
        />

        <button type="submit" id="log-exercise-duration">
          Log Exercise
        </button>
      </form>
    </div>
  );
}

export default ExerciseDurationForm;
