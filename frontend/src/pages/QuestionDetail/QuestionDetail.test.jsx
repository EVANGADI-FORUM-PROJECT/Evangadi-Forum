import { fireEvent, render, screen } from '@testing-library/react';
import { expect, test, vi } from 'vitest';
import { Link, MemoryRouter, Route, Routes } from 'react-router-dom';
import QuestionDetail from './QuestionDetail.jsx';

vi.mock('../../contexts/useAuth', () => ({ useAuth: () => ({ user: { id: 2 } }) }));
vi.mock('../../services/question/question.service.js', () => ({
  questionService: {
    getSingleQuestion: vi.fn(async hash => ({
      question: {
        id: hash === 'first' ? 1 : 2,
        title: hash === 'first' ? 'First question' : 'Second question',
        content: 'A question body',
        author: { id: 1, firstName: 'Author' },
      },
      answers: [],
    })),
    getSimilarQuestions: vi.fn(async () => ({ data: [] })),
  },
}));

test('opening another question resets the answer draft and question state', async () => {
  render(<MemoryRouter initialEntries={['/questions/first']}>
    <Link to="/questions/second">Open next question</Link>
    <Routes><Route path="/questions/:questionHash" element={<QuestionDetail />} /></Routes>
  </MemoryRouter>);
  await screen.findByRole('heading', { name: 'First question' }, { timeout: 20000 });
  fireEvent.change(screen.getByRole('textbox', { name: 'Answer markdown editor' }), {
    target: { value: 'Draft intended only for the first question' },
  });
  fireEvent.click(screen.getByRole('link', { name: 'Open next question' }));
  await screen.findByRole('heading', { name: 'Second question' }, { timeout: 20000 });
  expect(screen.getByRole('textbox', { name: 'Answer markdown editor' })).toHaveValue('');
  expect(screen.queryByRole('heading', { name: 'First question' })).not.toBeInTheDocument();
}, 30000);
