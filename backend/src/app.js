import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env } from './config/env.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// 1. Helmet security headers
app.use(helmet());

// 2. CORS configuration (specific origins only, no wildcard)
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (env.corsOriginsList.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS origin ${origin} not allowed`));
    },
    credentials: true,
  })
);

// 3. Body parser with payload size limit
app.use(express.json({ limit: '1mb' }));

// 4. HTTP request logging (dev format in development, combined in production, skip in test)
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// 5. Rate limiting on /api (100 requests per 15 minutes per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.NODE_ENV === 'test' ? 10000 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again after 15 minutes',
    },
  },
});

app.use('/api', apiLimiter);

// 6. Routes mounting
app.use('/', healthRoutes);

// Mount users routes under both /api/users and /api (for /api/me convenience)
app.use('/api/users', usersRoutes);
app.use('/api', usersRoutes);

// 7. Not found & central error handling
app.use(notFound);
app.use(errorHandler);

export default app;
