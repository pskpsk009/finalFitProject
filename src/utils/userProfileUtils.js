const USER_PROFILE_KEY = 'userProfile';

export const saveUserProfile = (profile) => {
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
};

export const authenticatedFetch = async (url, options = {}) => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found. User is not authenticated.");
    window.location.href = "/login"; // Redirect to login page
    return null;
  }

  const headers = {
    ...options.headers,
    Authorization: `Bearer ${token}`,
  };

  try {
    const response = await fetch(url, { ...options, headers });
    if (response.status === 401 || response.status === 403) {
      console.error("Token is invalid or expired. Redirecting to login.");
      localStorage.removeItem("token"); // Remove invalid token
      window.location.href = "/login"; // Redirect to login page
      return null;
    }
    return response;
  } catch (error) {
    console.error("Error making authenticated request:", error);
    return null;
  }
};

export const loadUserProfile = async () => {
  const response = await authenticatedFetch("http://localhost:5004/user/User");
  if (response) {
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    console.error("Failed to fetch user profile. Status:", response.status);
  }
  return { username: "", weight: null, height: null, bmi: null };
};

// Re-add and export the validateToken function
export const validateToken = async () => {
  const token = localStorage.getItem("token");
  if (!token) {
    console.error("No token found. User is not authenticated.");
    return false;
  }

  try {
    const response = await fetch("http://localhost:5004/validate-token", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.ok) {
      console.log("Token is valid.");
      return true;
    } else {
      console.error("Token is invalid or expired. Redirecting to login.");
      localStorage.removeItem("token"); // Remove invalid token
      return false;
    }
  } catch (error) {
    console.error("Error validating token:", error);
    localStorage.removeItem("token"); // Remove token on error
    return false;
  }
};
