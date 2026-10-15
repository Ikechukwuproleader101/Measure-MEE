# Task: Implement Standard Production-Ready CORS Policy

Please update the Express backend server (`app.js` or `server.js`) to include a secure, dynamic CORS configuration that allows the live Vercel frontend and local development environments to communicate seamlessly.

## Requirements:

1. **Environment-Driven Origins:**
   - Read allowed origins from an environment variable (e.g., `process.env.CORS_ORIGINS` or `process.env.FRONTEND_URL`).
   - Support comma-separated strings if multiple origins (like your Vercel production URL and local `http://localhost:5173`) are provided.
   - Fall back safely to `['http://localhost:5173', 'http://localhost:3000']` when running locally if the variable is absent.

2. **Credentials Support:**
   - Enable `credentials: true` to allow cookies, authorization headers, and tokens (essential for Google OAuth and Supabase authentication flows).

3. **Preflight Handling:**
   - Ensure `OPTIONS` preflight requests are properly handled across all routes.

## Implementation Example:

```javascript
const cors = require('cors');

// Parse allowed origins from environment variable or default to localhost
const allowedOrigins = process.env.CORS_ORIGINS 
  ? process.env.CORS_ORIGINS.split(',').map(origin => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, or server-to-server)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS policy'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight across all routes
```