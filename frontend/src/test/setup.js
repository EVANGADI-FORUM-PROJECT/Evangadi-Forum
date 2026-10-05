import '@testing-library/jest-dom/vitest';
import { afterEach, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import { JSDOM } from 'jsdom';

// A dedicated jsdom storage avoids Node's optional native Web Storage globals.
const storageWindow = new JSDOM('', { url: 'http://localhost/' }).window;
Object.defineProperty(globalThis, 'localStorage', {
  value: storageWindow.localStorage,
  configurable: true,
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});
afterAll(() => storageWindow.close());
