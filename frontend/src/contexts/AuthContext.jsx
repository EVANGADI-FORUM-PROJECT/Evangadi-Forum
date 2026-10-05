import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth/auth.service.js';

/**
 * Authentication Context providing user state and auth methods.
 */
import { AuthContext } from './useAuth.js';

/**
 * AuthProvider is a component that wraps the parts of your application that need authentication information.
 * AuthProvider component that wraps the app to provide authentication context.
 * children means everything inside <AuthProvider>.
 */
export function AuthProvider({ children }) {
  // Authentication state
  const [user, setUser] = useState(() => authService.getStoredToken() ? authService.getStoredUser() : null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  //   user = null
  // That means React initially doesn't know about a logged-in user.

  // application needs to check whether the user already has a valid/stored session.
  // Initialize user state from localStorage on mount

  /**
   * Registers a new user. Does not automatically log them in.
   * @param {Object} userData - { firstName, lastName, email, password }
   */
  const register = async (userData) => {
    setLoading(true);
    try {
      const { user } = await authService.register(userData);
      return { success: true, user };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Authenticates a user and updates the session state if successful..
   * @param {Object} credentials - { email, password }
   */
  const login = async (credentials) => {
    setLoading(true);
    try {
      const { user } = await authService.login(credentials);
      setUser(user);
      return { success: true };
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clears the user session and redirects to the login page.
   * handles removing/clearing the stored authentication session
   */
  const logout = () => {
    authService.logout();
    setUser(null);
    navigate("/auth");
  };

  // Context value with state and methods
  const value = {
    user,
    loading,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
  // put information into AuthContext.Provider so that it can be accessed by any component that consumes this context.
//   {
//     user,
//     loading,
//     register,
//     login,
//     logout,
//     isAuthenticated: !!user
// }
}

