import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import { env, normalizeOrigin } from './config/env.js';
import { healthRoutes } from './modules/health/health.routes.js';
import { usersRoutes } from './modules/users/users.routes.js';
import { notFound } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

app.set('trust proxy', 1);

// 1. Helmet security headers
app.use(helmet());

// 2. CORS configuration (environment-driven origins, credentials, and preflight support)
const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // curl, server-to-server, same-origin
    const normalized = normalizeOrigin(origin);
    if (env.corsOriginsList.includes(normalized) || env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    console.warn(`CORS blocked origin: ${normalized}`);
    return callback(null, false); // no CORS headers, no 500
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));


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
