import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ForgotPassword from './ForgotPassword.jsx';
import ResetPassword from './ResetPassword.jsx';

const services = vi.hoisted(() => ({ forgotPassword: vi.fn(), resetPassword: vi.fn() }));
vi.mock('../../services/auth/auth.service', () => ({ authService: services }));
afterEach(() => vi.clearAllMocks());
function mount(component, url = '/') { return render(<MemoryRouter initialEntries={[url]}>{component}</MemoryRouter>); }
test('forgot-password normalizes an email and displays the generic server response', async () => {
  services.forgotPassword.mockResolvedValue({ message: 'If an account exists, check your email.' });
  mount(<ForgotPassword />);
  fireEvent.change(screen.getByLabelText('Email Address'), { target: { value: 'LEARNER@EXAMPLE.COM' } });
  fireEvent.click(screen.getByRole('button', { name: 'Send Reset Link' }));
  expect(await screen.findByRole('status')).toHaveTextContent('If an account exists');
  expect(services.forgotPassword).toHaveBeenCalledWith('learner@example.com');
});
test('missing reset tokens show a recovery action and block submissions', () => {
  mount(<ResetPassword />, '/reset-password');
  expect(screen.getByRole('alert')).toHaveTextContent('Invalid reset link');
  expect(screen.getByRole('button', { name: 'Reset Password' })).toBeDisabled();
  expect(services.resetPassword).not.toHaveBeenCalled();
});
test('confirmation mismatch is rejected without calling the server', async () => {
  mount(<ResetPassword />, '/reset-password?token=' + 'a'.repeat(64));
  fireEvent.change(screen.getByLabelText('New Password'), { target: { value: 'new-password' } });
  fireEvent.change(screen.getByLabelText('Confirm Password'), { target: { value: 'different-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Passwords do not match');
  expect(services.resetPassword).not.toHaveBeenCalled();
});
test('a successful reset removes the form and offers sign-in without reusing the link', async () => {
  services.resetPassword.mockResolvedValue({ message: 'Password updated.' });
  mount(<ResetPassword />, '/reset-password?token=' + 'a'.repeat(64));
  for (const label of ['New Password', 'Confirm Password']) fireEvent.change(screen.getByLabelText(label), { target: { value: 'new-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Password updated');
  expect(screen.queryByRole('button', { name: 'Reset Password' })).not.toBeInTheDocument();
});
test('expired reset links display the server error', async () => {
  services.resetPassword.mockRejectedValue(new Error('Invalid or expired reset link.'));
  mount(<ResetPassword />, '/reset-password?token=' + 'a'.repeat(64));
  for (const label of ['New Password', 'Confirm Password']) fireEvent.change(screen.getByLabelText(label), { target: { value: 'new-password' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset Password' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('expired reset link');
});
