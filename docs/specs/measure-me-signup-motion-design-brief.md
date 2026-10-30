# Measure Me --- Sign-up Screen Redesign & Motion Specification

## 1. Project objective

Redesign the **Measure Me** authentication entry screen using the
supplied reference image as the visual direction. Preserve its
recognisable identity:

-   Near-black background.
-   White, rounded, friendly typography.
-   Soft lavender as the primary action colour.
-   Sewing and tailoring illustrations as the visual signature.
-   A simple, welcoming authentication flow.

The illustrations should feel alive through **subtle, continuous
motion**, but the screen must remain lightweight. Motion is decorative:
it must never compete with the sign-in actions, slow down the page, or
make the interface feel busy.

This document is an implementation brief. Treat the supplied screenshot
as the layout and art-direction reference, not as a pixel-perfect
constraint.

------------------------------------------------------------------------

## 2. Visual direction

### Design character

-   Minimal, expressive, playful, and modern.
-   Strong contrast: black background, white text, lavender actions.
-   Use the tailoring illustrations to communicate what the app does
    immediately.
-   Keep the composition spacious. Do not add extra cards, gradients,
    glows, or decorative UI that is not needed.
-   The overall result should feel like a polished mobile app screen,
    not a promotional landing page.

### Suggested design tokens

  Token           Value       Usage
  --------------- ----------- ------------------------------------
  Background      `#050505`   Main screen background
  Surface         `#111111`   Optional subtle surface
  Primary         `#C69AF3`   Main buttons and highlighted links
  Primary text    `#080808`   Text/icons inside lavender buttons
  Text            `#FFFFFF`   Main text
  Muted text      `#B8B8B8`   Supporting text
  Pattern         `#242424`   Static tailoring doodle strip
  Mint accent     `#64E5BD`   Selected illustration details
  Yellow accent   `#F2E64B`   Selected illustration details

Use the existing illustration colours where possible. Lavender should
remain the dominant interface accent; yellow and mint belong mainly to
the artwork.

### Typography

Use the project's existing font if it matches the reference. Otherwise,
use a clean rounded sans-serif such as **Poppins**.

-   App name: bold, approximately 30--36 px on a 390 px-wide mobile
    viewport.
-   Supporting/legal copy: 15--17 px, medium weight, comfortable line
    height.
-   Buttons: 17--19 px, semibold.
-   Signup prompt: 17--19 px.
-   Avoid using too many font weights.

------------------------------------------------------------------------

## 3. Screen structure

Build the screen as a single responsive vertical layout.

### A. Header

-   Display **Measure Me** near the top, horizontally centred.
-   Keep a generous gap between the title and illustration area.
-   Do not add a large navigation bar or unnecessary back button on this
    entry screen.

### B. Animated illustration stage

This is the visual centrepiece.

-   Use the tailoring-themed icons from the reference: sewing machine,
    yarn, needle and thread, mannequin, scissors, safety pin, measuring
    tape, thimble, buttons, pincushion, and dress/form illustration.
-   Arrange them as a loose, balanced collage around a horizontal strip
    of dark tailoring doodle patterns.
-   The collage should feel intentionally composed, not randomly
    scattered.
-   Keep the icons inside the screen's horizontal bounds. No important
    illustration should be clipped.
-   The pattern strip is a background layer. Keep it static; animate
    only the individual foreground icons.
-   Preserve clear negative space around the illustration group.

**Layer order**

1.  Black screen background.
2.  Static dark doodle/pattern strip.
3.  Foreground tailoring icons.
4.  UI content below the illustration.

Do not animate the pattern strip. Its movement would create unnecessary
visual noise and extra rendering work.

### C. Terms and privacy copy

Place the legal copy below the illustration stage:

> By continuing, you agree with our Terms and Privacy Policy

-   Centre the text.
-   Allow it to wrap naturally into two lines on narrow screens.
-   Highlight **Terms** and **Privacy Policy** in lavender.
-   Make both links independently tappable.
-   Use a comfortable line height and enough spacing before the buttons.

### D. Authentication actions

Use two full-width pill-shaped buttons, stacked vertically:

1.  **Continue with Google**
2.  **Continue with email**

Button requirements:

-   Lavender fill (`#C69AF3`).
-   Black icon and text.
-   Rounded pill shape.
-   Consistent height, ideally 56--64 px depending on viewport.
-   Icons and labels vertically aligned.
-   A clear pressed state: a very small scale reduction or darker
    lavender fill.
-   Do not add a large shadow or glow.
-   Use the official Google mark if the project already has an approved
    asset. Do not approximate the Google logo with a plain letter if a
    proper asset is available.

The Google button must trigger the project's Google authentication flow.
The email button must navigate to the email sign-in or
email-registration flow. Do not implement fake authentication behaviour.

### E. Signup prompt

Below the buttons, display:

> New User? signup

-   Keep the prompt centred.
-   White text for "New User?".
-   Lavender for "signup".
-   Make the signup text an accessible, clearly tappable link.
-   Keep a comfortable gap between the buttons and this prompt.

### F. Bottom decorative detail

If the reference's partial doodle pattern at the bottom is retained,
keep it subtle and static. It must not look like a cut-off interactive
element or interfere with the safe area.

------------------------------------------------------------------------

## 4. Motion direction: subtle infinite animation

### Overall motion principle

Use **slow, staggered, low-amplitude loops**. Each illustration should
have one simple motion personality. The motion should be noticeable when
someone looks at the artwork, but quiet enough that the user can read
and tap without distraction.

Do not animate every icon at the same time or with the same timing.
Avoid synchronised bouncing.

### Icon animation plan

  ------------------------------------------------------------------------
  Illustration     Infinite motion     Suggested duration Intensity
  ---------------- ---------------- --------------------- ----------------
  Sewing machine   Gentle vertical                  3.8 s Very subtle
                   bob, as if                             
                   lightly                                
                   operating                              

  Yarn ball        Slow rotation                     12 s Subtle

  Needle and       Small                            4.5 s Very subtle
  thread           side-to-side                           
                   tilt around its                        
                   centre                                 

  Scissors         Tiny open/close                  3.6 s Subtle
                   pivot, if the                          
                   artwork has                            
                   separate blades;                       
                   otherwise a                            
                   gentle tilt                            

  Mannequin        Slow vertical                    4.2 s Very subtle
                   float                                  

  Safety pin       Small                            4.8 s Very subtle
                   alternating tilt                       

  Measuring tape   Slow, short                      5.5 s Very subtle
                   horizontal drift                       

  Thimble          Small vertical                   3.4 s Subtle
                   bob                                    

  Pincushion       Gentle scale                     4.6 s Very subtle
                   pulse,                                 
                   approximately                          
                   1--2%                                  

  Button           Slow rotation of                   6 s Very subtle
                   a few degrees,                         
                   not a full spin                        

  Dress/form       Gentle sway from                 4.3 s Subtle
  illustration     its top anchor                         
  ------------------------------------------------------------------------

These are motion concepts, not instructions to force every asset to
move. If an icon's silhouette makes a motion look unnatural, keep it
static or choose the simpler alternative.

### Important animation rules

-   Keep movement small: approximately 2--5 px for floating or drifting
    elements.
-   Keep rotations restrained: generally 2--5 degrees.
-   Keep scale changes extremely small: approximately 1--2%.
-   Use `ease-in-out` for float, sway, and pulse animations.
-   Use `linear` only for the slow yarn rotation.
-   Give each icon a slightly different duration and animation delay.
-   Use `transform` and `opacity` only where possible.
-   Do not animate layout properties such as `top`, `left`, `width`,
    `height`, `margin`, or `padding`.
-   Do not animate large blurred shadows, filters, or background
    patterns.
-   Avoid spring physics, particle effects, continuous path drawing, and
    complex JavaScript animation loops.

### Motion should not feel like this

-   Every icon bouncing together.
-   Fast spinning objects.
-   Large rotations that make the illustrations look unstable.
-   Repeated zooming in and out.
-   Constant movement of the background pattern.
-   Animations that pull attention away from the authentication buttons.

------------------------------------------------------------------------

## 5. Lightweight implementation strategy

### Preferred approach

Use **CSS keyframes** for the decorative infinite animations.

Do not add GSAP, Framer Motion, Lottie, or another animation library
just for this screen. The planned movement is simple enough for CSS and
does not justify another runtime dependency.

### Asset recommendations

-   Prefer SVG illustrations with clean paths and transparent
    backgrounds.
-   If an illustration is a single SVG, animate the whole icon with one
    transform.
-   If a scissors or sewing machine illustration needs internal
    movement, separate only the necessary parts into groups. Do not
    rebuild every illustration as a complex rig.
-   Avoid large animated GIFs and videos.
-   Optimise SVG files and remove unnecessary metadata.
-   If raster assets must be used, export them at an appropriate
    resolution and compress them.

### Suggested CSS structure

Use a shared base class and small animation variants. The following is a
starting point; adapt class names to the project's component structure.

``` css
.illustration {
  position: absolute;
  transform-origin: center;
  will-change: transform;
  animation-fill-mode: both;
  pointer-events: none;
}

.motion-float {
  animation: gentle-float 4.2s ease-in-out infinite;
}

.motion-sway {
  transform-origin: 50% 85%;
  animation: gentle-sway 4.5s ease-in-out infinite;
}

.motion-rotate {
  animation: slow-rotate 12s linear infinite;
}

.motion-drift {
  animation: gentle-drift 5.5s ease-in-out infinite;
}

.motion-pulse {
  animation: soft-pulse 4.6s ease-in-out infinite;
}

@keyframes gentle-float {
  0%, 100% { transform: translate3d(0, 0, 0); }
  50% { transform: translate3d(0, -4px, 0); }
}

@keyframes gentle-sway {
  0%, 100% { transform: rotate(-2deg); }
  50% { transform: rotate(2deg); }
}

@keyframes slow-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes gentle-drift {
  0%, 100% { transform: translate3d(-2px, 0, 0); }
  50% { transform: translate3d(2px, -2px, 0); }
}

@keyframes soft-pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.015); }
}
```

**Implementation notes**

-   Apply each animation class to the correct illustration element.
-   Use a different `animation-delay` on each icon, for example `-1.2s`,
    `-2.4s`, or `-0.6s`, so the loops do not begin in sync.
-   Do not combine two classes that both animate `transform` on the same
    element. If an icon needs multiple motions, use a nested wrapper:
    one element handles rotation and its child handles floating.
-   Avoid adding `will-change` to every element by default. Apply it
    only if profiling shows a benefit; remove it if it increases memory
    use.
-   Keep the animation CSS in a dedicated file or clearly separated
    section so it is easy to tune.

### Example staggered assignment

``` css
.machine { animation: gentle-float 3.8s ease-in-out -1.1s infinite; }
.yarn { animation: slow-rotate 12s linear -4s infinite; }
.needle { animation: gentle-sway 4.5s ease-in-out -2s infinite; }
.mannequin { animation: gentle-float 4.2s ease-in-out -0.7s infinite; }
.tape { animation: gentle-drift 5.5s ease-in-out -3s infinite; }
```

Use the same principle for the remaining icons, choosing only the motion
that suits each asset.

------------------------------------------------------------------------

## 6. Accessibility and reduced motion

Respect the operating system's reduced-motion preference.

``` css
@media (prefers-reduced-motion: reduce) {
  .illustration {
    animation: none !important;
    transform: none !important;
  }

  .auth-button {
    transition: none;
  }
}
```

Also ensure:

-   Decorative illustrations are hidden from screen readers
    (`aria-hidden="true"`).
-   Authentication buttons have accessible names.
-   Legal links are keyboard accessible and have visible focus states.
-   Text contrast remains readable.
-   Motion is never required to understand the screen.

------------------------------------------------------------------------

## 7. Responsive behaviour

The reference is a tall mobile screen. Recreate the visual hierarchy
while allowing the layout to adapt to shorter and wider devices.

### Mobile

-   Use a full-width screen with horizontal padding of approximately 24
    px.
-   Keep the title near the top, respecting the top safe area.
-   Scale the illustration stage to the available width without
    distorting the icons.
-   Keep the legal text and buttons within the visible viewport on
    common phone sizes.
-   Use a scrollable page only when the available height genuinely
    requires it; do not force content underneath system UI.
-   Respect bottom safe-area insets.

### Short screens

-   Reduce the vertical gaps around the illustration stage first.
-   Slightly reduce illustration size if necessary.
-   Preserve button height and readable legal copy.
-   Do not solve overflow by shrinking all text excessively.

### Wider screens

-   Keep the authentication content at a sensible maximum width rather
    than stretching buttons across a tablet or desktop.
-   Centre the composition.
-   Preserve the illustration collage's proportions.

------------------------------------------------------------------------

## 8. Performance checklist

The screen should remain smooth on lower-powered Android devices.

-   [ ] No new animation library added for decorative icon motion.
-   [ ] No `setInterval` or `requestAnimationFrame` loop for simple
    decorative animations.
-   [ ] Animate transforms rather than layout dimensions or positions.
-   [ ] Keep the number of continuously animated elements reasonable.
-   [ ] Compress and optimise SVG/raster assets.
-   [ ] Keep the patterned background static.
-   [ ] Avoid expensive filters, large blur effects, and animated
    shadows.
-   [ ] Support `prefers-reduced-motion`.
-   [ ] Check performance on a lower-end Android device, not only a
    desktop browser.
-   [ ] Confirm that the page remains responsive while the animations
    are running.

------------------------------------------------------------------------

## 9. Functional requirements

The redesign must preserve or correctly implement the authentication
flow.

-   Google action starts the existing Google OAuth/authentication
    process.
-   Email action opens the email authentication flow.
-   Signup link opens the registration screen.
-   Terms and Privacy Policy open their respective destinations.
-   Buttons show appropriate loading and error states when
    authentication is in progress or fails.
-   Prevent repeated submissions while an authentication request is
    pending.
-   Do not change existing authentication logic, routes, or backend
    contracts unless required and explicitly understood.

------------------------------------------------------------------------

## 10. Implementation sequence

1.  Inspect the existing authentication screen, routing, assets, and
    authentication handlers.
2.  Rebuild the static layout to match the new visual direction.
3.  Make the illustration collage responsive and verify that no icon is
    clipped.
4.  Add the CSS-only icon animations one group at a time.
5.  Add staggered delays and tune the motion intensity.
6.  Implement reduced-motion behaviour.
7.  Verify all links and authentication actions.
8.  Test on a short mobile viewport and a standard mobile viewport.
9.  Profile the screen and remove any unnecessary animation or rendering
    cost.

------------------------------------------------------------------------

## 11. Acceptance criteria

The work is complete when:

-   The screen clearly follows the supplied Measure Me reference.
-   The black, white, and lavender visual identity is preserved.
-   The illustration collage is balanced and responsive.
-   The icons use subtle, varied, infinite animations rather than
    synchronised bouncing.
-   The animation system uses CSS keyframes and does not require a new
    animation dependency.
-   The background doodle pattern remains static.
-   Reduced-motion preferences are respected.
-   The authentication actions and legal links work with the existing
    application flow.
-   The screen remains readable, usable, and smooth on mobile devices.

**Final design principle:** the illustrations should feel gently alive,
not busy. The user should notice the craft-themed personality of Measure
Me before noticing the animations themselves.
