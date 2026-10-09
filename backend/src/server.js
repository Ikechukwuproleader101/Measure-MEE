import app from './app.js';
import { env } from './config/env.js';

const server = app.listen(env.PORT, () => {
  console.log(`🚀 Measure Me backend running in ${env.NODE_ENV} mode on http://localhost:${env.PORT}`);
  console.log(`📡 Health endpoint available at http://localhost:${env.PORT}/health`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('Shutting down server gracefully...');
  server.close(() => {
    console.log('Server process terminated.');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
