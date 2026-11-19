# Spec: Remove the Dev-Only Screen Switcher

## Goal

The app has a floating **"Screens"** button (top right, with a number badge). It opens a **"MOBILE SCREENS"** panel that lists every screen (Splash Screen, Onboarding Carousel, Sign Up / Create Account, Login, Dashboard Home, Projects List, Project Details, Measurement Guide, Camera Scanner, Processing Animation, Measurement Results, Croquis Canvas & Pins, Comments Screen, Share 48h Link) and lets me jump to any of them. It also shows a user chip with a Sign out link.

This was built for development only. Remove the button, the panel, and every file that exists only to support them. **Everything the real app needs must keep working exactly as it does now.**

## Golden Rules

1. Remove only the switcher UI and code that is used **nowhere else**.
2. Never delete a real screen, even if the switcher is the only thing that currently links to it. If a screen becomes unreachable, report it to me (see "Report Back").
3. Before deleting any file, prove it is switcher-only (search for every import and usage). If there is any doubt, keep the file and list it for me.
4. Work on a separate git branch (or commit the current state first) so everything can be undone.

## Step 1: Investigate and Report (change nothing yet)

Find and list:

- The component that renders the "Screens" button and the "MOBILE SCREENS" panel
- Where it is mounted (likely in `App`, a layout, or a root wrapper)
- The data it uses: the screen list (names and numbers #1 to #15), any registry or config file, any context, store or state used only by the switcher
- How the app moves between screens today:
  - If it uses a **router**, note which routes exist.
  - If it uses **a "current screen" state value** that the switcher sets, note how real navigation (buttons, onboarding next, login success, tapping cards) sets that same value.
- Every file in the project that is imported only by the switcher (components, hooks, styles, icons, constants, types, mock data)
- Any leftover items tied to it: dev-only environment flags, query-string toggles, keyboard shortcuts, CSS classes, comments and TODOs

Give me this list, split into **Safe to delete** (used only by the switcher) and **Keep** (also used by real screens), with the evidence for each. Then continue to Step 2.

## Step 2: Remove

1. Delete the "Screens" button and panel, and remove their mount point and imports.
2. Delete the files you listed as **Safe to delete**.
3. Remove any now-unused imports, state, props, constants, types and CSS left behind.
4. If the switcher exposed a way to jump to a screen with fake data (for example, skipping login or the camera), remove that bypass as well. The real flow must be the only way in.

## Things That Must NOT Break

- **Sign out.** The panel has a Sign out link. Before removing it, confirm Sign out exists on a real screen (for example Profile). If it does not, **do not delete it silently.** Tell me, and wait.
- **The user chip and name** shown in the panel are part of the switcher. The Home screen's own profile chip must stay.
- **Screen-to-screen navigation** used by real buttons and flows: splash into onboarding, onboarding into sign up and login, login into Home, Home and bottom nav (Home, Projects, Profile), project cards into project details, Add measurement into the capture flow, and the rest.
- **Session handling:** logged-in users still skip login on reload, and onboarding still does not re-show every login.
- **Hosted build:** the Vercel frontend must still build.

## Verification

1. Search the whole codebase (including `docs`, config and scripts) for: `Screens`, `MOBILE SCREENS`, the switcher component's name, and the registry/config names you found. No references should remain.
2. Run the type check and the production build. Both must pass with no new warnings about missing files or unused code.
3. Run the app and go through the real flow: splash, onboarding, sign up or login, Home, Projects, a project's details, Add measurement, and Profile. Confirm each works.
4. Confirm the floating button no longer appears on any screen, on both mobile and laptop widths.

## Report Back

When done, give me:
- The list of files deleted
- The list of files edited, with a one-line reason for each
- Anything you kept on purpose and why
- Any screen that is no longer reachable from the real app now that the switcher is gone (for example a screen that was only ever opened through the switcher)
- Confirmation that Sign out is still available on a real screen
