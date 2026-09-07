import { apiClient } from "../core/api.client.js";

/**
 * Registers a new user.
 * @param {Object} userData - User details for registration.
 */
async function register(userData) {
  try {
    // Send registration payload to the backend auth endpoint
    const response = await apiClient.post("/api/auth/register", userData);

    // Only return the user object — registration does not log the user in
    // automatically, so no token is stored here
    return { user: response.data.user };

    // Convert raw axios error into a friendly, typed Error object
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs in an existing user and stores their session in localStorage.
 * @param {Object} credentials - User login credentials.
 */
async function login(credentials) {
  try {
    // Send login credentials to the backend
    const response = await apiClient.post("/api/auth/login", credentials);
    // Destructure the user object and JWT token from the response
    const { user, token } = response.data;
    // Persist the token so apiClient's interceptor can attach it to
    // future requests (see api.client.js)
    localStorage.setItem("token", token);
    // Persist the user object (stringified, since localStorage only
    // stores strings) so the UI can rehydrate user info on page reload
    localStorage.setItem("user", JSON.stringify(user));

    return { user, token };
  } catch (error) {
    throw handleAuthError(error);
  }
}

/**
 * Logs out the current user by clearing localStorage.
 */
function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

/**
 * Retrieves the stored JWT token from localStorage.
 */
function getStoredToken() {
  return localStorage.getItem("token");
}

/**
 * Retrieves the stored user object from localStorage.
 */
function getStoredUser() {
  const userJson = localStorage.getItem("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch (error) {
    // If JSON parsing fails, clear invalid data
    localStorage.removeItem("user");
    return null;
  }
}

/**
 * Checks if the user is currently authenticated based on local storage.
 */
function isAuthenticated() {
  return !!getStoredToken();
}

/**
 * Centralized error handler for auth service requests.
 */
function handleAuthError(error) {
  if (!error.response) {
    if (error.code === "ECONNABORTED") {
      return new Error("Request timed out. Please try again.");
    }
    return new Error(
      "Unable to connect to server. Please check your internet connection.",
    );
  }

  const status = error.response.status;
  const backendMessage =
    error.response.data?.msg || error.response.data?.message;

  switch (status) {
    case 400:
      return new Error(backendMessage || "Invalid input data.");
    case 401:
      return new Error(backendMessage || "Invalid email or password.");
    case 500:
      return new Error(
        "Something went wrong on our end. Please try again later.",
      );
    default:
      return new Error(backendMessage || "An unexpected error occurred.");
  }
}

/**
 * Service for handling auth-related requests.
 */
export const authService = {
  register,
  login,
  logout,
  getStoredToken,
  getStoredUser,
  isAuthenticated,
};
