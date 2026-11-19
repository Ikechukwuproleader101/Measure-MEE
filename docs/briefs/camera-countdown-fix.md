# Fix: Camera Capture Countdown Keeps Respawning

## Problem

On the camera screen, MediaPipe pose validation turns green. The user presses the capture button and the 3-second countdown starts. Instead of finishing and taking the photo, the countdown keeps restarting (or spawning again), and the capture never happens.

## Expected Behavior

1. User presses the capture button (it is always available).
2. A 3-second countdown starts, exactly once.
3. When it reaches zero, the photo is captured from the current video frame.
4. Pose validation results arriving during the countdown must NOT start, reset, or duplicate the countdown.
5. After capture, the countdown is fully cleaned up and the screen is ready for the next step (or the next shot, front then side).

## Likely Root Cause

MediaPipe runs on every video frame (about 30 times per second). Anything in the validation loop that touches the countdown will reset it on every frame, so it never reaches zero. Check for these, in order:

1. **A `useEffect` that starts or resets the countdown and depends on the pose result** (green/red state, landmarks, angles). Every frame re-runs the effect, and the cleanup or restart kills the running timer.
2. **No guard against starting a second countdown.** The click handler, or the validation loop on seeing green, can start a countdown while one is already running, which stacks timers.
3. **`setInterval` without cleanup**, or one created during render, so a new interval appears on each re-render and the old ones keep running.
4. **Stale closure in the capture call.** If the capture runs only when a render-scoped `count` value equals 0, it may read an outdated value and never fire.
5. **Countdown state stored in React state while the timer logic lives in the frame loop**, so the two fight over it.

Find which of these applies before changing anything, and state which one it was.

## Required Fix Pattern

### Rules

- The countdown is started ONLY from the capture button's click handler. Never from a `useEffect` and never from the MediaPipe frame callback.
- Use a ref as a lock: `isCountingDownRef`. If it is already `true`, the click handler returns immediately.
- Keep the timer handle in a ref (`countdownTimerRef`), not in state, so frame-by-frame re-renders cannot affect it.
- Use `setTimeout` or a single `setInterval`, and capture inside the final callback, not in an effect watching `count`.
- The displayed number can be state (`countdownValue`) for rendering only. It must never be the thing that triggers the capture.
- Clean up the timer on unmount and whenever the camera closes.
- The MediaPipe loop must not read or write countdown state. It only updates pose validation state (per-body-part pass or fail, green or red).

### Reference Implementation (adapt to the existing code, do not paste blindly)

```jsx
const isCountingDownRef = useRef(false);
const countdownTimerRef = useRef(null);
const [countdownValue, setCountdownValue] = useState(null);

const handleCaptureClick = () => {
  if (isCountingDownRef.current) return; // guard: never start twice
  isCountingDownRef.current = true;

  let remaining = 3;
  setCountdownValue(remaining);

  countdownTimerRef.current = setInterval(() => {
    remaining -= 1;

    if (remaining > 0) {
      setCountdownValue(remaining);
      return;
    }

    clearInterval(countdownTimerRef.current);
    countdownTimerRef.current = null;
    setCountdownValue(null);

    takePhoto(); // grab the frame from the video element here
    isCountingDownRef.current = false;
  }, 1000);
};

useEffect(() => {
  return () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    isCountingDownRef.current = false;
  };
}, []); // cleanup on unmount only. Must NOT depend on pose state.
```

## Edge Cases to Handle

- **Pose turns red mid-countdown:** the countdown continues and the capture still happens (capture button is always available by design). Optionally show a subtle text hint, but never cancel or restart the countdown because of it.
- **User taps capture repeatedly:** extra taps are ignored by the ref guard. Optionally disable the button visually while counting.
- **User leaves the screen mid-countdown:** the timer is cleared on unmount and the lock is released.
- **Two shots (front and side):** the lock and timer reset fully after each capture so the second shot works the same way.
- **"Capture anyway" after 3 failed tries:** must use the same single-start countdown path, not a separate one.

## Acceptance Criteria

- Press capture once: the on-screen number goes 3, 2, 1 and then the photo is taken, exactly once.
- Pressing capture several times during the countdown does not restart or duplicate it.
- Pose validation flipping between red and green during the countdown does not affect the countdown.
- No leftover intervals or timeouts after capture, after unmount, or after leaving the screen (verify in React DevTools or by logging timer creation and clearing).
- Works for both the front and side photo slots.

## How to Debug If Unsure

1. Add `console.log("countdown start")` in the click handler and `console.log("countdown tick", remaining)` inside the interval. If "countdown start" prints more than once per click, something else is starting it.
2. Log inside the MediaPipe frame callback whether it touches any countdown state or function. It should not.
3. Search the camera component for every place `setCountdownValue`, `setInterval`, `setTimeout` and the capture function are called. There should be exactly one place that starts the countdown (the click handler) and one place that captures (the final tick).

## Scope

Fix only the countdown and capture flow described above. Do not change the pose validation rules, the red/green highlighting, the sound cues, the tilt sensing, or the image preview screen.
