import { afterEach, expect, test, vi } from 'vitest';
import { authService } from './auth.service.js';
const api = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock('../core/api.client.js', () => ({ apiClient: api }));
afterEach(() => vi.clearAllMocks());
test('Google sessions persist the same fields as password sessions', async () => {
  const user = { id: 1, firstName: 'Member' };
  api.post.mockResolvedValue({ data: { token: 'session', user } });
  expect(await authService.googleLogin('credential')).toEqual({ token: 'session', user });
  expect(api.post).toHaveBeenCalledWith('/api/auth/google', { credential: 'credential' });
  expect(localStorage.getItem('token')).toBe('session');
  expect(JSON.parse(localStorage.getItem('user'))).toEqual(user);
});
test('failed Google sign-in leaves existing credentials intact', async () => {
  localStorage.setItem('token', 'existing');
  api.post.mockRejectedValue({ response: { status: 401, data: { message: 'Invalid credential' } } });
  await expect(authService.googleLogin('bad')).rejects.toThrow('Invalid credential');
  expect(localStorage.getItem('token')).toBe('existing');
});
test('recovery endpoints receive only their required JSON fields', async () => {
  api.post.mockResolvedValue({ data: { message: 'Completed' } });
  await authService.forgotPassword('member@example.com');
  await authService.resetPassword('token', 'new-password');
  expect(api.post).toHaveBeenNthCalledWith(1, '/api/auth/forgot-password', { email: 'member@example.com' });
  expect(api.post).toHaveBeenNthCalledWith(2, '/api/auth/reset-password', { token: 'token', password: 'new-password' });
});
