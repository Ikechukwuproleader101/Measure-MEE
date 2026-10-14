# Task: Keep Users Logged In After Refresh or Reopen

## Problem
After logging in with Google (Supabase auth), refreshing the page or coming back later shows the login screen again. A logged-in user should skip the login screens until they press log out.

## Hard rules
- Work in `frontend/`. Only touch `backend/` if Step 6 finds a real bug, and explain it first.
- Do not change how the login, sign up, or Google screens look. Change logic only.
- Do not edit anything in the Supabase or Google Cloud dashboards. If a dashboard setting looks wrong, report it and the owner will change it.
- Do not store tokens or sessions by hand (no manual `localStorage.setItem` of tokens). Supabase already saves the session; the app just has to read it.
- You cannot open a browser here. Use code inspection, build, and lint, then hand the visual check to the owner (Step 7).

## Step 1: Inspect the Supabase client
Find where `createClient` is called and report:
1. How many places create a client. There must be **exactly one** shared client that every file imports.
2. The options passed in. Check `persistSession`, `autoRefreshToken`, `detectSessionInUrl`, and any custom `storage`. `persistSession` must not be `false`. If the options are not set, the defaults are correct, so leave them.
3. Which environment variables supply the URL and key, and whether they are read correctly (Vite uses `import.meta.env.VITE_...`).

If there is more than one client, merge them into one exported client and update the imports.

## Step 2: Find where "logged in" is decided
Search the frontend for the login screens, any route guard, any auth context or store, and any code that decides whether to show login or the app. Report:
1. The initial value of the logged-in state (for example `useState(false)`).
2. Whether `supabase.auth.getSession()` is called on startup.
3. Whether `supabase.auth.onAuthStateChange` is used.
4. Whether any part of login is fake or hardcoded (for example accepting any email, or a plain `isLoggedIn` flag). Real auth must come from Supabase only.

## Step 3: Fix the startup logic
Create or repair one auth provider (React context) that every screen reads from.

1. State: `session`, `user`, and `loading`, with `loading` starting as **true**.
2. On mount, call `supabase.auth.getSession()`, set `session` and `user` from the result, then set `loading` to false.
3. Subscribe with `supabase.auth.onAuthStateChange((event, session) => ...)` to keep `session` and `user` updated (login, logout, token refresh). Unsubscribe on unmount.
4. Expose `signOut`, which calls `supabase.auth.signOut()`.
5. The route guard or screen switcher must follow these rules:
   - While `loading` is true: show a neutral loading state (existing spinner or a blank screen). **Never show the login screen while loading.**
   - Loading finished and no session: show the login flow.
   - Loading finished and a session exists: show the app, and skip the login, sign up, and Google screens. If the user opens a login route while logged in, redirect them into the app.
6. The log out button must call `signOut`, and after that the login screen shows.

Keep the change small. Reuse existing components and styles.

## Step 4: Check the Google return trip
After Google login, the browser comes back to the app with login details in the address. Check that:
1. `signInWithOAuth` uses `redirectTo: window.location.origin` (or a path on the same origin), so the user returns to the same address the app runs on.
2. Nothing clears the address (`history.replaceState`, `navigate`, `window.location.hash = ""`) before Supabase has finished reading it. Supabase reads it automatically when `detectSessionInUrl` is true (the default).
3. The loading state from Step 3 is still showing during that return, so the user is not bounced to the login screen mid-way.

## Step 5: Keep the address stable
Browser storage belongs to one exact address, so `localhost:5174` and `localhost:5173` do not share a login.
1. Open `frontend/vite.config` and check the dev server port. Set `server: { port: 5174, strictPort: true }` so Vite fails loudly instead of silently moving to another port.
2. Report the exact redirect URL(s) the code uses, so the owner can confirm they match the Supabase URL configuration list.

## Step 6: Backend calls (report first, change only if broken)
If the frontend sends the logged-in user's token to the backend:
1. Confirm it reads the token fresh from the session on each request (`session.access_token`) and sends it as `Authorization: Bearer <token>`, not from a stored copy that can go stale.
2. Confirm that a failed request with an expired token does not force a logout by itself.
Report what you found. Only fix something that is clearly broken.

## Step 7: Checks you can run
1. `npm run build` inside `frontend/` and report pass or fail.
2. Lint if configured, for the files you touched.
3. Start the dev server, check its output for compile errors, then stop it.

## Step 8: Human check (for the project owner, not for you)
After your changes, the owner should:
1. Log in with Google. Press F12, open **Application**, then **Local Storage**, then `http://localhost:5174`. A key starting with `sb-` and ending with `-auth-token` should be there.
2. Refresh the page. Expected: a brief loading state, then straight into the app, with no login screen.
3. Close the tab, open `http://localhost:5174` again. Expected: still logged in.
4. Press log out. Expected: login screen, and the `sb-...-auth-token` key disappears.
5. Log in with email and password, then repeat steps 2 and 3.

## Report format
```
Supabase client:        (how many instances, options used)
How login state was decided before: (short description)
getSession on startup:  yes / no (before and after)
onAuthStateChange:      yes / no (before and after)
Fake or hardcoded auth: none / (where)
Files created:          (list)
Files changed:          (list, one line each)
Redirect URL(s) in code: (list)
Vite port setting:      (before and after)
Backend token handling: ok / (issue found)
Build:                  pass / fail
Lint:                   pass / fail / not configured
Needs human check:      yes (Step 8)
```
