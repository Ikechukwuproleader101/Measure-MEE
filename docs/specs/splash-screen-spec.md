# Task: Update the splash screen to the new "Measure Me" design

## Goal
Replace the visual design of the existing splash screen with the new one described below. Match the reference screenshot (`Android_Compact_-_2.png`, supplied by the user) as closely as possible.

## Rules
- React only. **Do not install any new packages.** Use plain React and CSS.
- Find the existing splash screen component and edit it in place. Do NOT change how long it shows, where it navigates afterwards, or any auth / loading logic that runs behind it. This is a visual update only.
- The splash is **static**: no animation on the text, background or pattern. No fade, zoom, bounce or movement.

## Design
- **Full-screen, edge to edge** (`100vw` x `100dvh`), no scrolling, no margins or padding showing around it.
- **Background:** solid light purple (match the banner purple, approximately `#C9A7F9`; sample the exact value from the screenshot) with a tonal tribal line-pattern overlaid across the whole screen. The pattern is a slightly lighter purple than the background, low contrast, so it reads as texture and not as artwork.
- **Pattern asset:** load it from the project's local image/assets folder (for example `splash-pattern.png` or `.svg`). If it is not there yet, import a clearly named placeholder path, and in your final message tell the user which file name to drop in. Do not generate or hand-draw the pattern.
- **Pattern fit:** apply it as a background image with `background-size: cover` and `background-position: center`, so it fills any phone or laptop size without a visible seam, gap or repeat line. The screenshot contains stray seams and edge artifacts (a horizontal line near the lower right and a visible join near the bottom). **Do not reproduce those**. The pattern must look clean and continuous.
- **Text:** the words "Measure Me", white, bold, geometric rounded sans-serif (use the font the app already uses for headings; do not add a new font). Centred horizontally, and placed at roughly the vertical centre of the screen (slightly below the exact middle in the reference, around 48 to 50 percent from the top). Size about 32 to 36px on a phone, scaling with `clamp()` on larger screens.
- Nothing else on the screen: no logo, no tagline, no loader, no buttons.

## Implementation notes
- A single wrapper `div` with the background colour and pattern image, `display: flex`, `align-items: center`, `justify-content: center`, `min-height: 100dvh`.
- Remove the old splash visuals (previous background colour, logo or animation styles) so nothing from the old design shows through or lingers in the CSS.
- Make sure the text colour has enough contrast against the purple (white on this purple is fine; keep it fully white, not translucent).
- Check it on a small phone width (about 360px), a large phone, and a laptop width. Text stays centred and the pattern always fills the screen.

## Acceptance criteria
- [ ] Splash shows the purple patterned background with "Measure Me" in white, centred.
- [ ] It is fully static, with no animation.
- [ ] No seams, lines or gaps in the pattern at any screen size.
- [ ] Display duration, navigation and any logic behind the splash are unchanged.
- [ ] No new dependencies; no console errors.

## When finished
Tell the user which files you changed and which pattern image file name they need to place in the assets folder.
