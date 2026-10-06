# 🎨 IDE Prompt — Tailor App Onboarding Illustration (GSAP Animations)

> **Copy and paste this entire prompt into Cursor, Copilot Chat, Windsurf, or any AI coding assistant.**

---

## Context

I am building a **tailor measuring app**. My onboarding screen contains an **inline SVG illustration** of a woman sitting on a bench using her phone, surrounded by a plant, floating UI cards, and delivery boxes. I want to bring this illustration to life with **GSAP (GreenSock Animation Platform)** animations.

---

## Illustration Elements & Their SVG IDs

The SVG has the following named elements you should animate. **Do not change these IDs or classes.**

| Element | ID / Class | Description |
|---|---|---|
| Entire SVG | `#illustration` | Root SVG element |
| Plant group | `#plant` | Contains pot, stems, and all leaves |
| Individual leaves | `.leaf` / `#leaf-1` → `#leaf-5` | Each leaf is a `<g>` wrapping an `<ellipse>` |
| Bench / platform | `#platform` | Two rect layers the person sits on |
| Person group | `#person` | Contains all body parts |
| Torso / shirt | `#person-torso` | **Main breathing element** — scale this |
| Head | `#person-head` | Rises with breath |
| Hair | `#person-hair` | Nested inside `#person-head`, sways gently |
| Left arm | `#arm-left` | Resting arm |
| Right arm | `#arm-right` | Holds phone |
| Extended leg | `#leg-extended` | Goes outward to the right |
| Bent leg | `#leg-bent` | Drops downward |
| Shoes | `#shoe-left`, `#shoe-right` | White sneakers |
| Phone body | `#phone` | Entire phone group |
| Phone screen glow | `#phone-screen-glow` | Transparent rect — animate its `opacity` |
| Speech bubble | `#speech-bubble` | Floating app UI popup card (upper right) |
| Clothing icon | `#clothing-icon` | Shirt icon inside the speech bubble |
| Checklist | `#checklist` | Measurement lines inside the speech bubble |
| Notification bubble | `#notification-bubble` | Small circle with paper-plane icon (left) |
| Sparkles | `.sparkle` / `#sparkle-1` → `#sparkle-3` | Cross/star shapes near the phone |
| Delivery boxes | `#boxes`, `#box-large`, `#box-small` | Right side |

---

## Critical SVG + GSAP Rule

> ⚠️ **Always add this CSS to the SVG scope or stylesheet:**
>
> ```css
> svg * {
>   transform-box: fill-box;
> }
> ```
>
> Without `transform-box: fill-box`, SVG elements rotate around the **SVG canvas origin (top-left corner)** instead of their own bounding box. This makes every rotation/scale look broken.

---

## Animation Goals

### 1. 🌿 Plant Leaf Sway
Each `.leaf` should sway back and forth as if blown by a gentle breeze.

**Requirements:**
- Rotate each leaf from its **bottom center** (the stem attachment point)
- Alternate sway direction between leaves (left, right, left, right…)
- Each leaf should have a **slightly different duration** (1.9s to 3.1s)
- Stagger the start of each leaf by ~0.22s so they don't all move together
- Use `ease: "sine.inOut"` for natural movement
- Use `repeat: -1` and `yoyo: true` for endless loop

```js
gsap.to(".leaf", {
  rotation: 6,                        // degrees — vary per leaf
  transformOrigin: "bottom center",   // pivot at stem base
  duration: 2.4,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
  stagger: 0.22,
});
```

---

### 2. 🫁 Person Breathing
Simulate a realistic ~3.2 second breath cycle.

**Requirements:**

**a) Torso expand/contract:**
```js
gsap.to("#person-torso", {
  scaleY: 1.028,
  scaleX: 1.012,
  transformOrigin: "center bottom",   // expand upward, not downward
  duration: 3.2,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});
```

**b) Head and shoulders rise:**
```js
gsap.to(["#person-head", "#person-hair"], {
  y: -3,
  duration: 3.2,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});
```

**c) Arms rise slightly with torso:**
```js
gsap.to("#person-arms", {
  y: -1.8,
  duration: 3.2,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});
```

**d) Phone moves with the arm (sync to same duration):**
```js
gsap.to("#phone", {
  y: -1.8,
  duration: 3.2,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});
```

**e) Hair sways gently (slightly offset from breath):**
```js
gsap.to("#person-hair", {
  rotation: 0.9,
  transformOrigin: "center bottom",
  duration: 3.5,          // slightly different from breath = more natural
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
  delay: 0.4,
});
```

---

### 3. 💬 Speech Bubble Float
The app UI popup card gently bobs up and down.

```js
gsap.to("#speech-bubble", {
  y: -8,
  duration: 3.0,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});
```

---

### 4. 🔔 Notification Bubble Pulse
Gentle scale pulse to draw attention.

```js
gsap.to("#notification-bubble", {
  scale: 1.1,
  transformOrigin: "center center",
  duration: 1.8,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});
```

---

### 5. 📱 Phone Screen Glow
The transparent overlay rect pulses its opacity.

```js
gsap.to("#phone-screen-glow", {
  opacity: 0.75,
  duration: 2.2,
  repeat: -1,
  yoyo: true,
  ease: "sine.inOut",
});
```

---

### 6. ✨ Sparkle Twinkle
Each sparkle fades and shrinks independently.

```js
document.querySelectorAll(".sparkle").forEach((sparkle, i) => {
  gsap.fromTo(sparkle,
    { opacity: 1, scale: 1 },
    {
      opacity: 0.05,
      scale: 0.4,
      transformOrigin: "center center",
      duration: gsap.utils.random(0.8, 1.5),
      repeat: -1,
      yoyo: true,
      ease: "power1.inOut",
      delay: i * 0.38,
    }
  );
});
```

---

### 7. 🎬 Entrance Timeline (runs once on mount)
Stagger all elements in on first load, then start the ambient loops.

```js
const entrance = gsap.timeline({
  defaults: { ease: "power3.out" },
  onComplete: startAllLoops,
});

entrance
  .from("#background",          { opacity: 0, duration: 0.4 })
  .from("#platform",            { y: 40,  opacity: 0, duration: 0.7 })
  .from("#person",              { y: 25,  opacity: 0, duration: 0.9 }, "-=0.5")
  .from("#plant",               { x: -30, opacity: 0, duration: 0.7 }, "-=0.6")
  .from("#boxes",               { x: 30,  opacity: 0, duration: 0.7 }, "-=0.7")
  .from("#speech-bubble",       { y: -20, opacity: 0, scale: 0.92, duration: 0.7 }, "-=0.4")
  .from("#notification-bubble", { scale: 0, opacity: 0, duration: 0.5 }, "-=0.3")
  .from("#phone",               { scale: 0.7, opacity: 0, duration: 0.4 }, "-=0.4")
  .from(".sparkle",             { scale: 0, opacity: 0, stagger: 0.12, duration: 0.35 }, "-=0.2");
```

---

## React Integration (using `useGSAP`)

If the project uses **React**, wrap all GSAP calls in `useGSAP()` from `@gsap/react` for automatic cleanup.

```bash
npm install gsap @gsap/react
```

```jsx
import { useRef } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

export default function OnboardingIllustration() {
  const svgRef = useRef(null);

  useGSAP(() => {
    // All GSAP code goes here.
    // GSAP will auto-clean up when the component unmounts.

    const entrance = gsap.timeline({ onComplete: startAllLoops });
    // ... entrance animation ...

    function startAllLoops() {
      // ... leaf sway, breathing, float, etc. ...
    }

  }, { scope: svgRef });   // scope: limits selectors to this SVG

  return (
    <div ref={svgRef}>
      <svg id="illustration" viewBox="0 0 480 360">
        {/* SVG content here — inline, not as <img src="..."> */}
      </svg>
    </div>
  );
}
```

> **Important:** The SVG must be **inlined** in JSX, not loaded as `<img src="..."/>`.
> An `<img>` tag renders as a bitmap — GSAP cannot reach inside it.
> Export or paste the SVG markup directly into the JSX component.

---

## Things NOT to Do

| ❌ Don't | ✅ Do instead |
|---|---|
| Load the SVG as `<img src="...">` | Inline the SVG in JSX / HTML |
| Animate the whole `#person` group for breathing | Animate `#person-torso` and `#person-head` separately |
| Use the same duration for all leaves | Randomize with `gsap.utils.random(1.9, 3.1)` |
| Forget `transform-box: fill-box` in CSS | Always add it to `svg *` |
| Call GSAP outside `useGSAP()` in React | Always use `useGSAP()` for proper cleanup |

---

## Tech Stack

- **GSAP** `^3.12.x` — animation engine
- **`@gsap/react`** — `useGSAP` hook for React cleanup
- **React** (or plain HTML with vanilla JS)
- **Inline SVG** — mandatory for element-level targeting

---

*This prompt was generated for the tailor measuring app onboarding screen animation project.*
