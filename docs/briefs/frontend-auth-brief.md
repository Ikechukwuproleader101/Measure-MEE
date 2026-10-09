# Frontend Auth Brief (for Antigravity)

## 1. Task

Replace the frontend's fake login with **real Supabase authentication**. Right now the sign in screen accepts any email. After this task:

- Sign up creates a real user in Supabase.
- Sign in only succeeds when the email and password match an existing Supabase user. Anything else shows an error.
- "Continue with Google" signs the user in through Supabase and Google.
- Protected pages open only when there is a real session.

**This is a wiring task. Do not redesign anything.** The sign up, sign in and Google screens already exist. Keep their layout, styling, copy and illustrations exactly as they are.

## 2. Current state (already done, do not redo)

- The repo is structured as `frontend/`, `backend/`, `services/`, `external/`, `docs/`
- Supabase project is set up with Email and Google providers enabled
- Database tables and the signup trigger already exist in Supabase. A `profiles` row is created automatically when a user signs up.
- The backend runs on `http://localhost:4000` and exposes `GET /api/users/me`, which needs a Bearer token
- The frontend runs on `http://localhost:5174`
- `frontend/.env` exists with real values for `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `VITE_API_BASE_URL`

## 3. Hard rules

- **Only touch `frontend/`.** Do not change `backend/`, `services/`, `external/` or `docs/`.
- **Never print, log, hardcode or commit values from `.env`.** Read them only through `import.meta.env`. Do not overwrite the existing `frontend/.env`.
- **Only the public (anon/publishable) key belongs in the frontend.** Never ask for, add or use a service role or secret key here.
- Do not change the visual design, routes' URLs, or the screen flow beyond adding auth gating.
- Do not add a router if one already exists. Use the existing one. Do not add libraries other than `@supabase/supabase-js`.
- Keep TypeScript types strict. No `any` for auth objects, use the types from `@supabase/supabase-js`.
- Remove all fake or mock login logic (see Phase 4). Do not leave hardcoded credentials, fake sessions or "accept any email" code anywhere.

## 4. Build in phases

Finish and check each phase before starting the next. After each phase, stop and give a short report: what changed, what you verified, and any assumptions.

### Phase 1: Supabase client and auth state

1. Install `@supabase/supabase-js` in `frontend/`.
2. Create `src/lib/supabaseClient.ts`. It reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `import.meta.env` and creates the client. If either is missing, throw a clear error message that names the missing variable (never its value).
3. Create an auth provider (for example `src/auth/AuthProvider.tsx`) with a hook `useAuth()` that exposes:
   - `session`, `user`
   - `loading` (true until the initial session check finishes)
   - `signUp`, `signIn`, `signInWithGoogle`, `signOut`
4. In the provider, call `supabase.auth.getSession()` on mount, then subscribe with `supabase.auth.onAuthStateChange(...)`. Unsubscribe on unmount.
5. Wrap the app with the provider.

**Check:** app still loads and looks identical. `useAuth()` reports `loading` then `session = null` when logged out.

### Phase 2: Wire email sign up, sign in and sign out

**Sign up screen**
- Call `supabase.auth.signUp({ email, password, options: { data: { full_name }, emailRedirectTo: window.location.origin } })`. Only include `full_name` if the existing screen collects a name.
- If the response contains a session, the user is signed in. Continue to the screen the app already goes to after signup.
- If there is **no session**, email confirmation is required. Show a clear "Check your email to confirm your account" message and do not log the user in.
- Show errors from Supabase in the UI (for example, email already registered, weak password). Use friendly wording and keep the existing error styling.

**Sign in screen**
- Call `supabase.auth.signInWithPassword({ email, password })`.
- On failure, show a single generic message such as "Invalid email or password". Do not reveal whether the email exists.
- On success, go to the screen the app already goes to after login.
- Disable the submit button while the request is running to prevent double submits.

**Sign out**
- Call `supabase.auth.signOut()`, then send the user to the sign in screen.

**Validation**
- Basic client-side checks only: valid email format, password not empty. Match the minimum password length to the Supabase setting, and if unsure use 8 characters. The server is the real authority.

**Check:** a made-up email and password is rejected with an error. A real user created in Supabase can sign in.

### Phase 3: Google sign in

- The "Continue with Google" button calls `supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } })`.
- Redirect URLs are already configured in Supabase for `http://localhost:5174`. Do not change them.
- After Google sends the user back, the Supabase client picks up the session from the URL automatically. Make sure the app does not flash the sign in screen while this happens (use the `loading` state).
- Clean the URL after the session is detected if the app leaves auth parameters visible.

**Check:** clicking the button opens Google, and returning lands the user in the app as signed in.

### Phase 4: Route protection and removing the fake login

1. Create a protected-route wrapper using the existing router. While `loading` is true, show the app's existing loading state or nothing. If there is no session, redirect to the sign in screen. If there is a session, render the page.
2. Wrap every page that should require login. If it is unclear which pages are public, treat the sign in, sign up and any splash or onboarding intro as public, and everything else as protected. List your choice in the report.
3. If a logged-in user opens the sign in or sign up screen, redirect them into the app.
4. **Search the whole `frontend/src/` folder** for the old fake auth: hardcoded users, "isLoggedIn" flags kept in state or `localStorage`, mock login functions, or any code that logs in without calling Supabase. Remove or replace all of it, and list in the report what you removed.
5. Make sure the session survives a page refresh, and that signing out clears it.

**Check:** opening a protected page while logged out sends you to sign in. After signing in and refreshing, you stay signed in.

### Phase 5: Talk to the backend with the token

1. Create `src/lib/api.ts`: a small helper that calls `import.meta.env.VITE_API_BASE_URL`, reads the current session's `access_token` from Supabase at call time, and sends `Authorization: Bearer <token>`. Do not cache the token yourself.
2. If the backend returns `401`, sign the user out and redirect to the sign in screen.
3. After login, call `GET /api/users/me` once and keep the returned profile in the auth context (add `profile` to `useAuth()`). Handle errors without crashing the UI.
4. Make sure no screen displays raw tokens or logs them.

**Check:** after signing in, the network tab shows a successful `GET /api/users/me` with a 200 response and the profile data.

## 5. Pin the dev port

In `frontend/vite.config.ts`, set `server: { port: 5174, strictPort: true }` so the port always matches the Supabase redirect URLs and the backend CORS setting. Do not change anything else in that file.

## 6. Final report checklist

Report the result of each item:

- [ ] A made-up email and password is rejected
- [ ] Sign up creates a user (the owner will confirm the user and its `profiles` row in Supabase)
- [ ] Both email-confirmation cases are handled: session returned, and no session returned
- [ ] Sign in works for a real user, and wrong credentials show a generic error
- [ ] Google sign in works end to end
- [ ] Refresh keeps the session, sign out clears it
- [ ] Protected pages redirect to sign in when logged out
- [ ] All fake or mock login code is removed (list what you removed)
- [ ] `GET /api/users/me` returns 200 after login
- [ ] No `.env` values appear in code, logs, comments or terminal output
- [ ] `backend/`, `services/`, `external/` and `docs/` are unchanged
- [ ] `npm run build` and `npm run lint` pass

## 7. If something is unclear

Pick the simplest option, write the choice in the report, and keep going. If something would require changing the backend, the Supabase settings, or the visual design, stop and ask instead.
