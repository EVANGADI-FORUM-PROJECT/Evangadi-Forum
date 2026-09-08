import axios from 'axios';

/**
 * Configured Axios instance for API communication.
 *
 * The base URL is read from the Vite environment variable
 * VITE_API_BASE_URL. If it is not defined, the API defaults
 * to the local backend running on port 3777.
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3777',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor.
 *
 * Runs before every API request and checks localStorage for
 * the user's JWT authentication token. If a token exists,
 * it is automatically attached to the Authorization header.
 */
apiClient.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
     // Handle errors that occur while preparing the request.
    return Promise.reject(error);
  },
);

/**
 * Response interceptor.
 *
 * Runs after receiving an API response. Successful responses
 * are returned normally.
 *
 * If the server responds with HTTP 401 Unauthorized, the user's
 * authentication data is cleared and they are redirected to the
 * authentication page.
 */
apiClient.interceptors.response.use(
  response => {
    // Return successful API responses unchanged.
    return response;
  },
  error => {
    // Skip global 401 redirect for auth endpoints so components can handle login/register errors
    const isAuthEndpoint =
      error.config?.url?.includes('/api/auth/login') ||
      error.config?.url?.includes('/api/auth/register');

    if (error.response?.status === 401 && !isAuthEndpoint) {
      // Clear authentication data
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Redirect to login page
      window.location.href = '/auth';
    }
    return Promise.reject(error);
  },
);

export { apiClient };