import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, expect, test, vi } from 'vitest';
import Navbar from './Navbar.jsx';

const router = vi.hoisted(() => ({
  navigate: vi.fn(),
  location: { pathname: '/dashboard', search: '?semantic=react%20hooks' },
}));
vi.mock('react-router-dom', () => ({
  useNavigate: () => router.navigate,
  useLocation: () => router.location,
}));
afterEach(() => {
  vi.useRealTimers();
  router.navigate.mockClear();
  router.location = { pathname: '/dashboard', search: '?semantic=react%20hooks' };
});

test('keeps bookmarked AI searches instead of changing them to keyword searches', () => {
  vi.useFakeTimers();
  render(<Navbar title="Forum" />);
  expect(screen.getByRole('textbox')).toHaveValue('react hooks');
  act(() => vi.advanceTimersByTime(600));
  expect(router.navigate).not.toHaveBeenCalled();
});

test('debounces typed keyword edits', () => {
  vi.useFakeTimers();
  render(<Navbar title="Forum" />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'new query' } });
  act(() => vi.advanceTimersByTime(499));
  expect(router.navigate).not.toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(1));
  expect(router.navigate).toHaveBeenCalledWith('/dashboard?q=new%20query', { replace: true });
});

test('reflects external URL changes without triggering a keyword search', () => {
  vi.useFakeTimers();
  const view = render(<Navbar title="Forum" />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: 'draft' } });
  router.location = { pathname: '/dashboard', search: '?semantic=database%20connection' };
  view.rerender(<Navbar title="Forum" />);
  expect(screen.getByRole('textbox')).toHaveValue('database connection');
  act(() => vi.advanceTimersByTime(600));
  expect(router.navigate).not.toHaveBeenCalled();
});

test('clearing a search returns to the unfiltered dashboard', () => {
  vi.useFakeTimers();
  render(<Navbar title="Forum" />);
  fireEvent.change(screen.getByRole('textbox'), { target: { value: '' } });
  act(() => vi.advanceTimersByTime(500));
  expect(router.navigate).toHaveBeenCalledWith('/dashboard', { replace: true });
});
