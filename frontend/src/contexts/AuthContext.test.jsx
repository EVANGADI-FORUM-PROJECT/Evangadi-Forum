import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from './AuthContext.jsx';
import { useAuth } from './useAuth.js';

function Session() {
  const { user, loading, logout } = useAuth();
  return <><span>{loading ? 'Loading' : user?.firstName || 'Guest'}</span><button onClick={logout}>Sign out</button></>;
}
function renderSession() {
  return render(<MemoryRouter><AuthProvider><Session /></AuthProvider></MemoryRouter>);
}

test('restores a saved session during initial render', () => {
  localStorage.setItem('token', 'saved-token');
  localStorage.setItem('user', JSON.stringify({ id: 7, firstName: 'Learner' }));
  renderSession();
  expect(screen.getByText('Learner')).toBeInTheDocument();
  expect(screen.queryByText('Loading')).not.toBeInTheDocument();
});

test('malformed saved user data falls back to a signed-out session', () => {
  localStorage.setItem('token', 'saved-token');
  localStorage.setItem('user', '{broken');
  renderSession();
  expect(screen.getByText('Guest')).toBeInTheDocument();
  expect(localStorage.getItem('user')).toBeNull();
});

test('signing out clears stored credentials and the rendered session', () => {
  localStorage.setItem('token', 'saved-token');
  localStorage.setItem('user', JSON.stringify({ id: 7, firstName: 'Learner' }));
  renderSession();
  fireEvent.click(screen.getByRole('button', { name: 'Sign out' }));
  expect(screen.getByText('Guest')).toBeInTheDocument();
  expect(localStorage.getItem('token')).toBeNull();
  expect(localStorage.getItem('user')).toBeNull();
});
