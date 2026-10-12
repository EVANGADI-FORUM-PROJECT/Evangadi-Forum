import 'dotenv/config';
import express from 'express';
import http from 'http';
import { initSocket } from './src/socket/socket.server.js';
import { db } from './db/config.js';
import { mainRouter } from './src/api/routes.js';
import { errorHandler } from './src/middleware/error-handler.js';
import cors from 'cors';
import { avatarDirectory, migrateAvatars } from './src/api/profile/avatar.files.js';

const app = express();
const port = process.env.PORT || 3777;

// Middleware
app.use(cors());
app.use(express.json({ limit: '3mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

app.use('/uploads/avatars', express.static(avatarDirectory, { dotfiles: 'deny', index: false, setHeaders: res => res.set('X-Content-Type-Options', 'nosniff') }));
app.use('/api', mainRouter);

app.use(errorHandler);

const httpServer = http.createServer(app);
initSocket(httpServer);

// Start server
const startServer = async () => {
  try {
    // Test database connection
    const connection = await db.getConnection();

    console.log('Database connection established successfully.');
    connection.release();

    await migrateAvatars();
    httpServer.listen(port, err => {
      if (err) {
        console.error('Failed to start the server:', err.message);
        process.exit(1);
      }
      console.log(`Server running on port http://localhost:${port}`);
    });
  } catch (error) {
    console.error(
      'Failed to connect to the database. Server not started.',
      error.message,
    );
    process.exit(1);
  }
};

startServer();
