// T-13 — Layout Shell
// Task: Wire Layout, Navbar, Sidebar, ProtectedRoute, and protected forum routes.
// TODO: Teammate implementing T-13 should complete the protected route structure.

import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Auth from './pages/Auth/Auth';
import Landing from './pages/Landing/Landing';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes — existing project functionality */}
          <Route path='/' element={<Landing />} />
          <Route path='/auth' element={<Auth />} />

          {/* T-13 — Protected forum route shell */}
          {/* TODO: Add Layout + ProtectedRoute and the T-14/T-15/T-16/T-20/T-21 routes here. */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
