# Task: Replace the dashboard "Launch Scan" banner with a rotating carousel banner

## Goal
On the website dashboard, there is currently ONE static purple promo banner card with a headline, a cutout image of a person, and a black "Launch Scan" button. Replace it with a single banner card that automatically rotates between two slides, carousel style. It is NOT two separate cards. It is one card whose text and image change.

## Rules
- React only. **Do not install any new packages or libraries.** Use plain React (hooks) and CSS.
- First find the existing banner component on the dashboard and replace it in place. Keep the same card size, border radius, margins and position in the dashboard layout.
- Keep the existing "Launch Scan" click behaviour exactly as it works today (same handler / route). Do not change what the button does.
- Only touch the banner. Do not refactor other parts of the dashboard.

## What stays fixed (does not move or change between slides)
- The purple card background (#C9A7F9-ish, match the existing banner) and its tonal pattern.
- The black pill "Launch Scan" button with the camera icon, bottom-left.
- The card's rounded corners and overall dimensions.

## What changes between slides (slides together as one panel)
Each slide has a headline block and a cutout image. They move together as one unit.

| # | Headline line 1 (black) | Headline line 2 (large, white, bold) | Image |
|---|---|---|---|
| 1 | Want to get your dress done with | BIGGIE's? | Woman with afro and colourful floral shirt |
| 2 | No need to go see that tailor. Just | SNAP! | Man with patterned glasses, tall black hat and black-and-white print shirt |

- Text sits on the left, image on the right and bottom-aligned, cropped by the card's bottom edge, as in the current design.
- Images are transparent-background cutouts. Load them from the project's local image/assets folder. Look for them as `banner-1` and `banner-2` (or whatever the user has placed there); if they are missing, use clearly named placeholder imports and tell the user which file names to drop in.
- Keep the slide data in a simple array at the top of the component so slides can be added or edited easily:
  `const slides = [{ id, lineOne, lineTwo, image, imageAlt }]`

## Behaviour
1. **Autoplay:** advance to the next slide every **5 seconds**. After the last slide, loop back to the first.
2. **Transition:** carousel style. The current slide slides out to the left while the next slides in from the right, using a `translateX` track. Duration about **500ms**, `ease-in-out`. Subtle, not flashy. Do not animate the background, pattern or button.
3. **Dots:** two small indicator dots, placed at the bottom-right of the card (clear of the image's main subject and the button). The active dot is highlighted (for example filled white, wider pill), inactive dots are semi-transparent white. Dots are clickable buttons that jump to that slide and reset the autoplay timer.
4. **Pause:** pause autoplay while the pointer hovers over the card, while the card is touched, and while the browser tab is hidden. Resume afterwards with a fresh 5 second countdown.
5. **Reduced motion:** if `prefers-reduced-motion: reduce` is set, replace the slide with a plain fade or an instant swap (no sliding).
6. **Cleanup:** clear all timers and listeners on unmount. Avoid stacking multiple intervals when the user clicks dots quickly.

## Implementation notes
- Structure: an outer card (`overflow: hidden`, relative) with the fixed background and fixed button; inside it a track `div` containing all slides side by side (`display: flex`, each slide `min-width: 100%`), moved with `transform: translateX(-index * 100%)` and a CSS `transition: transform 500ms ease-in-out`.
- The button and dots are absolutely positioned above the track so they do not move with it.
- Use `useState` for the active index and `useEffect` with `setInterval`/`setTimeout` for autoplay, keyed on the active index so manual dot clicks restart the timer.
- Responsive: the headline font scales down on small screens (use `clamp()`), text never overlaps the image, and the card keeps its aspect ratio on mobile.
- Accessibility: wrap in a region with `aria-roledescription="carousel"` and an `aria-label`; each slide gets `aria-label="1 of 2"` etc; dots have `aria-label="Go to slide 1"` and `aria-current` on the active one. Image `alt` text comes from the slide data.

## Acceptance criteria
- [ ] Only one banner card appears on the dashboard, in the same spot and size as before.
- [ ] It auto-advances every 5 seconds with a smooth sideways carousel slide and loops forever.
- [ ] Text and image change together; background pattern and Launch Scan button stay still.
- [ ] Dots show the current slide and are clickable.
- [ ] Hover or touch pauses it; leaving resumes it.
- [ ] Launch Scan still does exactly what it did before.
- [ ] No new dependencies were added; no console errors or warnings.
- [ ] Looks right on mobile and laptop widths.

## When finished
Briefly tell the user which files you changed and which image file names they need to place in the assets folder.
