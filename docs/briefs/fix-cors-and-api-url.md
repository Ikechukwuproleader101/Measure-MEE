# Task: Fix Backend CORS for the Hosted App and Make the API Address Safe in Production

## Problem
The frontend is hosted on Vercel at `https://measure-me-app.vercel.app`. The backend is hosted on Render. The hosted app cannot talk to the backend. The browser reports CORS errors and "Failed to fetch". Causes found so far:

1. The allowed-origins list built from the environment variable may keep a trailing slash (`https://measure-me-app.vercel.app/`), so it never matches the origin the browser sends (no slash).
2. `app.options('*', cors(corsOptions))` is redundant (`app.use(cors(...))` already answers preflight requests), and the `'*'` pattern throws at startup on Express 5.
3. `PATCH` is missing from the allowed methods.
4. There is no `trust proxy` setting, but Render runs the app behind a proxy. The rate limiter then sees every user as one IP.
5. A rejected origin currently goes through the error handler and returns a 500 with no CORS headers, which hides the real cause.
6. The frontend falls back to `http://localhost:4000` if its API variable is missing, so a misconfigured production build silently calls localhost.

## Hard rules
- Do not print, log, commit, or write any real secret (Supabase keys, tokens, passwords). Use placeholders in examples and `.env.example`.
- Do not change route logic, auth logic, or database code. Only CORS, proxy setting, env parsing, and the frontend API address handling.
- Do not change how any screen looks.
- Keep the existing code style (ES modules, existing folder layout).
- You cannot reach the internet or the hosted services from here. Verify with local tests and static checks, then hand the live check to the owner.

## Part 1: Inspect first (report before changing)
1. Open `backend/src/config/env.js` (or wherever `env` is defined). Report:
   - The **exact name** of the environment variable that feeds `env.corsOriginsList` (for example `CORS_ORIGINS`), how it is split and trimmed, and whether trailing slashes are removed.
   - The default for `NODE_ENV`. The current check `env.NODE_ENV !== 'production'` allows **every origin** whenever `NODE_ENV` is not exactly `production`. Report what happens if `NODE_ENV` is unset.
   - Which variables are required at startup (so tests know which dummy values to set).
2. Open `backend/.env.example` (if it exists) and report whether the CORS variable is documented.
3. Report the entry file that starts the server (where `app.listen` is called) and confirm it uses `process.env.PORT` (or `env.PORT` fed from it), with a local default of 4000.
4. Find the health route's exact path from `healthRoutes` for use in tests.

## Part 2: Fix origin parsing in `env.js`
1. Add and export a small pure function:
```js
export function normalizeOrigin(value) {
  return String(value || '').trim().replace(/\/+$/, '').toLowerCase();
}
```
2. Build `corsOriginsList` by splitting the CORS variable on commas, running every item through `normalizeOrigin`, and dropping empty items. It must work for values with trailing slashes, extra spaces, or mixed case.
3. If `NODE_ENV` is `production` and the list is empty, print one clear warning at startup: `No CORS origins configured; all browser requests from other origins will be blocked.` Do **not** crash the server.
4. Do not rename the existing variable. Keep its current name so nothing already set on Render breaks.

## Part 3: Fix `app.js`
1. Right after `const app = express();` add `app.set('trust proxy', 1);`.
2. Replace the origin check with one that normalizes the incoming origin too, using the same `normalizeOrigin`:
```js
origin: (origin, callback) => {
  if (!origin) return callback(null, true); // curl, server-to-server, same-origin
  const normalized = normalizeOrigin(origin);
  if (env.corsOriginsList.includes(normalized) || env.NODE_ENV !== 'production') {
    return callback(null, true);
  }
  console.warn(`CORS blocked origin: ${normalized}`);
  return callback(null, false); // no CORS headers, no 500
},
```
   The warning must name only the origin, never headers or tokens.
3. Add `'PATCH'` to `methods`. Keep `credentials: true` and `allowedHeaders: ['Content-Type', 'Authorization']`.
4. **Delete** the line `app.options('*', cors(corsOptions));`.
5. Leave the order of everything else unchanged (helmet, cors, body parser, morgan, rate limiter, routes, `notFound`, `errorHandler`).
6. Do not loosen anything else. Keep the non-production allow-all behavior only as it already is, and mention in the report that the owner should make sure `NODE_ENV=production` is set on Render.

## Part 4: `.env.example` and notes
Add (or update) these lines with placeholder values and a short comment:
```
# Comma-separated list of allowed browser origins. No spaces needed; trailing slashes are ignored.
CORS_ORIGINS=http://localhost:5174,https://measure-me-app.vercel.app
```
(Use the real variable name found in Part 1 if it is different.)

## Part 5: Frontend API address (`frontend/src/lib/api.ts`)
The current line is:
```ts
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';
```
Change it so that:
1. A trailing slash on the value is removed (`https://x.onrender.com/` must not produce `//api/...`).
2. In a **production build** (`import.meta.env.PROD`), if `VITE_API_BASE_URL` is missing, it does **not** fall back to localhost. It throws an `Error('API address is not configured')` when an API call is made, so the existing error screen shows a clear message instead of a misleading network failure.
3. In development, the localhost fallback stays exactly as it is.
4. Keep the exported names and behavior of everything else in the file unchanged. Search the rest of `frontend/src` for other hardcoded `localhost:4000` addresses and report them (fix them the same way only if they are API calls).

## Part 6: Tests (backend, no internet needed)
Use the backend's existing test runner. If none exists, use Node's built-in `node --test`. Do not add heavy new dependencies; use Node's `fetch` and an HTTP server on port 0.

Write tests that set these **before importing the app** (use dummy values for any other required variables):
`NODE_ENV=production` and the CORS variable set to `https://measure-me-app.vercel.app/,http://localhost:5174` (note the deliberate trailing slash and the mixed formatting).

1. `normalizeOrigin` and list parsing: trailing slashes, spaces, uppercase, and empty items all normalize correctly.
2. **Preflight, allowed origin:** `OPTIONS /api/users/me` with `Origin: https://measure-me-app.vercel.app`, `Access-Control-Request-Method: GET`, and `Access-Control-Request-Headers: authorization,content-type`. Expect status 204 (or 200), `access-control-allow-origin` equal to exactly `https://measure-me-app.vercel.app`, `access-control-allow-credentials: true`, and `access-control-allow-methods` containing `PATCH`.
3. **Preflight, unknown origin** (`https://evil.example.com`): expect **no** `access-control-allow-origin` header and no 500.
4. **Simple request, allowed origin:** `GET` on the health path with the allowed Origin returns 200 and the allow-origin header.
5. **No Origin header:** `GET` on the health path returns 200.
6. An unauthenticated `GET /api/users/me` still returns 401 (not changed by this task).

Then run the tests, the backend lint if configured, and `npm run build` inside `frontend/` (and lint if configured).

## Part 7: Live check (for the project owner, not for you)
After this task is done and pushed to GitHub:
1. On Render, set `NODE_ENV=production` and the CORS variable to `https://measure-me-app.vercel.app,http://localhost:5174`. Wait for the deploy to show **Live**.
2. In Vercel, confirm `VITE_API_BASE_URL` is the Render address (`https://...onrender.com`, no slash at the end, no `/api`), then **Redeploy** without the build cache.
3. In PowerShell, run (use `curl.exe`, not `curl`):
```
curl.exe -i -X OPTIONS https://YOUR-SERVICE.onrender.com/api/users/me -H "Origin: https://measure-me-app.vercel.app" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: authorization,content-type"
```
   Expected: a `204`, and a header `access-control-allow-origin: https://measure-me-app.vercel.app`.
4. Open the hosted app on a laptop, hard refresh, log in. The "Connection Error" screen should no longer appear. Then try it on the phone in Chrome or Safari (not inside another app's built-in browser).
5. If the first call takes about a minute, that is the free Render plan waking up, not a bug.

## Report format
```
env.js findings:        (CORS variable name, NODE_ENV default, required variables)
Files changed:          (list, one line each)
Files created:          (list)
Hard-coded localhost found in frontend: (list, or none)
Tests:                  pass / fail (counts, runner used)
Backend lint:           pass / fail / not configured
Frontend build:         pass / fail
Frontend lint:          pass / fail / not configured
Secrets touched:        none
Needs live check:       yes (Part 7)
Anything unclear:       (questions for the owner)
```
