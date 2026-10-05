import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';
import { useAuth } from './useAuth.js';
const api = vi.hoisted(() => ({
  getStoredToken: () => null, getStoredUser: () => null,
  googleLogin: vi.fn().mockResolvedValue({ user: { id: 1, firstName: 'Google member' } }),
}));
vi.mock('../services/auth/auth.service.js', () => ({ authService: api }));
function Session() {
  const { googleLogin, user, loading } = useAuth();
  return <><span>{loading ? 'Signing in' : user?.firstName || 'Guest'}</span><button onClick={() => googleLogin('credential')}>Google sign in</button></>;
}
test('Google sign-in transitions a guest to an authenticated forum user', async () => {
  render(<MemoryRouter><AuthProvider><Session /></AuthProvider></MemoryRouter>);
  expect(screen.getByText('Guest')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Google sign in' }));
  expect(await screen.findByText('Google member')).toBeInTheDocument();
  expect(api.googleLogin).toHaveBeenCalledWith('credential');
});
