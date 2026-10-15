import test from "node:test";
import assert from "node:assert/strict";
import { validateSidePose } from "./validateSidePose.js";

const createGoodSidePose = () => {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }));
  const set = (i, x, y, z = 0, visibility = 0.99) => {
    lm[i] = { x, y, z, visibility };
  };

  set(0, 0.49, 0.12); // nose

  // Left side facing camera (visibility 0.99)
  set(11, 0.50, 0.25, 0.0, 0.99); // left shoulder
  set(13, 0.50, 0.38, 0.0, 0.99); // left elbow
  set(15, 0.50, 0.50, 0.0, 0.99); // left wrist
  set(23, 0.50, 0.55, 0.0, 0.99); // left hip
  set(25, 0.50, 0.72, 0.0, 0.99); // left knee
  set(27, 0.50, 0.88, 0.0, 0.99); // left ankle

  // Right side (hidden/farther side, occluded)
  set(12, 0.51, 0.25, 0.05, 0.25); // right shoulder
  set(14, 0.51, 0.38, 0.05, 0.25); // right elbow
  set(16, 0.51, 0.50, 0.05, 0.25); // right wrist
  set(24, 0.51, 0.55, 0.05, 0.25); // right hip
  set(26, 0.51, 0.72, 0.05, 0.25); // right knee
  set(28, 0.51, 0.88, 0.05, 0.25); // right ankle

  return lm;
};

test("1. Good side pose returns valid: true and no reasons", () => {
  const pose = createGoodSidePose();
  const res = validateSidePose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, true);
  assert.deepEqual(res.reasons, []);
});

test("2. Empty or too-short landmark array returns valid: false", () => {
  const emptyRes = validateSidePose([], { width: 1280, height: 720 });
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.reasons.length > 0);

  const shortRes = validateSidePose(Array.from({ length: 20 }), { width: 1280, height: 720 });
  assert.equal(shortRes.valid, false);
});

test("3. Shoulders far apart (facing camera) returns valid: false and sideways reason", () => {
  const pose = createGoodSidePose();
  // Move right shoulder out to x = 0.65 as if chest is facing camera
  pose[12] = { ...pose[12], x: 0.65 };

  const res = validateSidePose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Turn 90 degrees so you are facing sideways")));
});

test("4. Arm raised away from body returns valid: false and arms relaxed reason", () => {
  const pose = createGoodSidePose();
  // Raise left wrist out to the side
  pose[15] = { ...pose[15], x: 0.35, y: 0.32 };

  const res = validateSidePose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Let your arms hang naturally at your sides")));
});

test("5. Visible-side ankle with low visibility returns valid: false and whole body reason", () => {
  const pose = createGoodSidePose();
  // Left ankle visibility drops below 0.5
  pose[27] = { ...pose[27], visibility: 0.2 };

  const res = validateSidePose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Make sure your whole body is visible")));
});

test("6. Ankle out of frame returns valid: false and step back reason", () => {
  const pose = createGoodSidePose();
  // Ankle y placed at 0.99 (> 1 - 0.02)
  pose[27] = { ...pose[27], y: 0.99 };

  const res = validateSidePose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Step back so your whole body fits")));
});

test("7. Body too small (far away) returns valid: false and move closer reason", () => {
  const pose = createGoodSidePose();
  // Nose at y = 0.35, ankle at y = 0.75 -> bodyHeight = 0.40 (< 0.55)
  pose[0] = { ...pose[0], y: 0.35 };
  pose[27] = { ...pose[27], y: 0.75 };

  const res = validateSidePose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Move a little closer")));
});

test("8. Heavy lean returns valid: false and stand up straight reason", () => {
  const pose = createGoodSidePose();
  // Shift shoulder to 0.35 while ankle is at 0.55
  pose[11] = { ...pose[11], x: 0.35 };
  pose[27] = { ...pose[27], x: 0.55 };

  const res = validateSidePose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Stand up straight")));
});
