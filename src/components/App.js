import React, { useState } from 'react';
import Login from './components/Login';
import FrontendLogger from './components/FrontendLogger'; // Link to FrontendLogger.js

const App = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div>
      {isLoggedIn ? (
        <FrontendLogger /> // Render FrontendLogger after successful login
      ) : (
        <Login onLogin={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
};

export default App;
