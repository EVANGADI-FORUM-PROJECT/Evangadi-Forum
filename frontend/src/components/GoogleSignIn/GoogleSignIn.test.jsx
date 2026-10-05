import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import GoogleSignIn from './GoogleSignIn.jsx';

const sdk = vi.hoisted(() => ({ credential: 'google-credential' }));
vi.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }) => children,
  GoogleLogin: ({ onSuccess, onError }) => <><button onClick={() => onSuccess({ credential: sdk.credential })}>Google sign in</button><button onClick={onError}>Cancel Google</button></>,
}));
afterEach(() => { vi.unstubAllEnvs(); sdk.credential = 'google-credential'; });
test('Google UI is optional when no client ID is configured', () => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', '');
  render(<GoogleSignIn onCredential={vi.fn()} onError={vi.fn()} />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
test('a verified SDK credential is handed to the forum session flow', async () => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client');
  const accept = vi.fn().mockResolvedValue();
  render(<GoogleSignIn onCredential={accept} onError={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Google sign in' }));
  await waitFor(() => expect(accept).toHaveBeenCalledWith('google-credential'));
});
test('missing credentials and SDK cancellation are surfaced accessibly by the parent', () => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client'); sdk.credential = undefined;
  const error = vi.fn(); const accept = vi.fn();
  render(<GoogleSignIn onCredential={accept} onError={error} />);
  fireEvent.click(screen.getByRole('button', { name: 'Google sign in' }));
  expect(accept).not.toHaveBeenCalled(); expect(error).toHaveBeenCalledWith(expect.stringContaining('valid credential'));
  fireEvent.click(screen.getByRole('button', { name: 'Cancel Google' }));
  expect(error).toHaveBeenCalledWith(expect.stringContaining('cancelled'));
});
test('duplicate SDK callbacks do not start concurrent sign-ins', () => {
  vi.stubEnv('VITE_GOOGLE_CLIENT_ID', 'test-client');
  const accept = vi.fn(() => new Promise(() => {}));
  render(<GoogleSignIn onCredential={accept} onError={vi.fn()} />);
  fireEvent.click(screen.getByRole('button', { name: 'Google sign in' }));
  fireEvent.click(screen.getByRole('button', { name: 'Google sign in' }));
  expect(accept).toHaveBeenCalledTimes(1);
});
