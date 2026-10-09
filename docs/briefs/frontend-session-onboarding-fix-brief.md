# Frontend Fix Brief: Stay Logged In + Show Onboarding Only Once

## 1. Problems to fix

1. **Reload shows the login flow again.** A user who is already logged in reloads the page and is sent back through the login flow. They should go straight into the app and only see login again after they sign out.
2. **Onboarding repeats on every login.** After logging in, the user has to click through all the onboarding screens again. Onboarding should show **once per account**, the first time, and never again.

This is a routing and state fix. **Do not redesign or restyle any screen.**

## 2. Current state

- Supabase auth is wired into the frontend (`useAuth()` hook with `session`, `user`, `loading`, and sign in, sign up, Google and sign out)
- The database has a `profiles` table with a boolean column `onboarding_completed` (default `false`). A profile row is created automatically for every new user.
- The backend (`http://localhost:4000`) already allows updating this flag: `PATCH /api/users/me` with `{ "onboarding_completed": true }`, and `GET /api/users/me` returns the profile
- Frontend runs on `http://localhost:5174`

## 3. Hard rules

- **Only touch `frontend/`.** If the backend rejects `onboarding_completed` in the PATCH call, stop and report it. Do not edit `backend/`.
- Never print, log or commit `.env` values.
- Do not change the look, copy or order of any existing screen.
- Do not store the onboarding status in `localStorage` or any browser storage. **The database flag is the single source of truth**, so it works across browsers and devices.
- Do not add libraries.

## 4. Step 0: investigate first and report before changing code

Read the current code and write a short report answering these questions. Then continue to the fix.

1. Why does a reload show the login flow? Check at least: does the app's starting route always point to the first login or onboarding screen? Is a route guard deciding before `loading` finishes? Is any code clearing the session? Is the Supabase client created with session persistence turned off?
2. Where do the onboarding screens get triggered after login, and why are they shown every time?
3. Which screens count as the **pre-login flow** (splash, intro slides, sign in, sign up), which count as **onboarding** (the screens that should show once after the first login), and which are the **main app**?

If any onboarding screen collects information from the user (for example preferences or personal details), list what it collects and where it currently saves it. Do not invent storage for it yet. Just report.

## 5. The routing rule (implement exactly this)

Create one central decision point (a single guard or app-entry component) that decides where the user goes. Use this table:

| Auth `loading` | Session | Profile | Where the user goes |
|---|---|---|---|
| true | any | any | Show the app's existing loading state or nothing. **Never flash the login or onboarding screens.** |
| false | none | n/a | Pre-login flow (existing screens) |
| false | yes | still loading | Same loading state as above |
| false | yes | `onboarding_completed = false` | Onboarding |
| false | yes | `onboarding_completed = true` | Main app (the screen the app opens after login) |

Details:

- **Reload behavior:** on reload, wait for the session check, then apply the table. A logged-in user with onboarding done must land in the main app, never in the pre-login flow.
- **Logged-in users and pre-login screens:** if a logged-in user navigates to splash, intro, sign in or sign up, redirect them according to the table (onboarding or main app).
- **Logged-out users and protected screens:** redirect to the pre-login flow, and after login return them to the page they originally requested when possible.
- **Profile loading:** fetch the profile with `GET /api/users/me` once the session exists, and keep it in the auth context (`profile`, `profileLoading`). Do not decide routing until the profile has loaded.
- **Profile fetch fails** (network or server error): do **not** send the user to onboarding as a fallback. Show a simple error state with a retry button using the app's existing styling. A 401 means sign the user out and return them to sign in.

## 6. Completing onboarding

- On the **last onboarding screen** (and on any "skip" action, if skipping exists), call `PATCH /api/users/me` with `{ "onboarding_completed": true }`.
- Update the profile in the auth context from the response, then navigate to the main app.
- If the request fails, stay on the screen, show an error, and let the user retry. Do not navigate on failure.
- Do not let the user press the final button twice while the request runs.
- Going back into onboarding by URL after it is completed must redirect to the main app (covered by the routing table).

## 7. Test accounts that already exist

Accounts created before this fix have `onboarding_completed = false`, so they will see onboarding one more time. That is expected and correct. Do not write code to work around it. The owner can set the flag manually in Supabase if needed.

## 8. Final report checklist

Report the result of each item:

- [ ] Logged in, reload on any page: lands in the app, with no login flow and no flash of the login screen
- [ ] Logged in, onboarding already completed: logging out and back in goes straight to the main app, with no onboarding
- [ ] Brand-new account (email): sign up leads to onboarding once, finishing it leads to the main app, then log out and in again skips it
- [ ] Brand-new account (Google): same behavior as above
- [ ] Logged out: protected pages redirect to the pre-login flow
- [ ] Logged in, visiting the sign in or sign up URL directly: redirected into the app
- [ ] Profile fetch failure shows a retry state and does not drop the user into onboarding
- [ ] Onboarding status is read from and written to the database only, with nothing stored in browser storage for it
- [ ] The Step 0 report was delivered, including anything the onboarding screens collect
- [ ] `backend/`, `services/`, `external/` and `docs/` are unchanged
- [ ] `npm run build` and `npm run lint` pass

## 9. If something is unclear

Pick the simplest option, write the choice in the report, and keep going. If something would require changing the backend, Supabase settings or the visual design, stop and ask instead.
