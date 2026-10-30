# Task: Stop the full-screen spinner that appears when the user returns to the tab or app

## The problem
When a user leaves the tab (switches tabs, opens another app, multitask overlay) and comes back, the whole screen is replaced by a loading spinner for roughly 3 to 5 seconds. The user is NOT logged out, and after the spinner they land on the same page they were on. This is bad UX and not how normal websites behave.

## What this tells us
The session is fine. Something is setting a global `loading` flag back to `true` when the tab regains focus, and a wrapper (for example `if (loading) return <Spinner />`) then blanks the entire app until the check finishes.

## Rules
- Do not install new packages.
- Do not change how login, logout, Google sign-in or email sign-in work. Only change how and when the loading state is used.
- Keep the spinner for the genuine first load of the app (first visit, hard refresh, or opening the site fresh). Only the refocus behaviour should change.

## Investigate first (find the real cause, then fix it)
Search the codebase for each of the following and report what you find before changing anything:

1. **The auth provider / context** (where the user and session are stored). Look at the `loading` state: where it is initialised, and every place it is set to `true`.
2. **The auth state listener** (for example `onAuthStateChange` if Supabase is used, or the equivalent). Auth libraries often fire an event (such as `SIGNED_IN` or `TOKEN_REFRESHED`) again when the tab regains focus. Check whether the handler sets `loading` to `true` or re-fetches the profile and shows a loader each time.
3. **Any wrapper or route guard** that renders a full-screen spinner while `loading` is true (for example `ProtectedRoute`, `App.jsx`, a layout, or a `Suspense` fallback).
4. **Any `visibilitychange`, `focus`, `pageshow` or `online` listeners**, and any `window.location.reload()` calls.
5. **Data fetching on focus:** any library or hook that refetches on window focus (for example React Query `refetchOnWindowFocus`, SWR `revalidateOnFocus`) and any page that shows a full-screen loader whenever it refetches.
6. **Service worker / PWA update logic** that might trigger a reload when the app returns to the foreground.

## The fix (apply whatever matches what you found)
1. **Loading only on first load.** Initialise `loading` as `true`, and set it to `false` once the first session check completes. After that, never set it back to `true` for background re-checks.
2. **Quiet auth events.** In the auth state listener, when an event fires and the user id is the same as the user already in state, do nothing visible: do not set `loading`, do not clear the user, do not re-fetch the profile with a loader. Update the stored session silently if needed. Only react visibly to a real change (a different user, or a genuine sign-out).
3. **Do not blank the screen on refetch.** Anywhere a full-screen spinner is shown for data, show it only when there is no data yet (`isLoading` on first fetch). On refetch, keep the existing data on screen and refresh in the background (use "isFetching" style flags for tiny, optional indicators only, never a full-screen takeover).
4. **Remove or neutralise** any `visibilitychange` / `focus` handler or forced reload that restarts the app when the tab is refocused, unless it is genuinely needed. If one is needed, make it refresh silently.
5. **Keep it quiet for the user.** No spinner, no flicker, no layout jump when returning to the tab. The screen they left should be the screen they see.

## Acceptance criteria
- [ ] Switch to another tab or app for 10+ seconds, then come back: no spinner and no flicker; the page is exactly as it was.
- [ ] Repeat on mobile with the multitask / app-switcher overlay: same result.
- [ ] Repeat after being away for a long time (5+ minutes, so the session token needs refreshing): still no full-screen spinner, and the user is still signed in.
- [ ] A hard refresh or opening the site fresh still shows the spinner while the first session check runs.
- [ ] Real sign-out still works and still sends the user to the right screen.
- [ ] Login flows (Google and email) are unchanged.
- [ ] No console errors, no new dependencies.

## When finished
Tell the user in plain language: (1) which file and which line was causing the spinner, (2) what you changed, and (3) anything else you noticed that could cause a similar problem.
