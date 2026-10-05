import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        pool: 'threads',
        maxWorkers: 1,
        environment: 'jsdom',
        setupFiles: './src/test/setup.js',
    },
});
