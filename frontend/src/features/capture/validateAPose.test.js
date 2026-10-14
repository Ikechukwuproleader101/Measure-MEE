import test from "node:test";
import assert from "node:assert/strict";
import { validateAPose } from "./validateAPose.js";

const base = () => {
  const lm = Array.from({ length: 33 }, () => ({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }));
  const set = (i, x, y) => { lm[i] = { x, y, z: 0, visibility: 0.99 }; };
  set(0, 0.5, 0.10);                       // nose
  set(11, 0.44, 0.24); set(12, 0.56, 0.24); // shoulders
  set(13, 0.397, 0.356); set(14, 0.603, 0.356); // elbows
  set(15, 0.354, 0.472); set(16, 0.646, 0.472); // wrists
  set(23, 0.46, 0.55); set(24, 0.54, 0.55);     // hips
  set(27, 0.444, 0.90); set(28, 0.556, 0.90);   // ankles
  return lm;
};

test("1. The good pose returns valid: true and no reasons", () => {
  const pose = base();
  const res = validateAPose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, true);
  assert.deepEqual(res.reasons, []);
});

test("2. Empty or too-short landmark array returns valid: false", () => {
  const emptyRes = validateAPose([], { width: 1280, height: 720 });
  assert.equal(emptyRes.valid, false);
  assert.ok(emptyRes.reasons.length > 0);

  const shortRes = validateAPose(Array.from({ length: 20 }), { width: 1280, height: 720 });
  assert.equal(shortRes.valid, false);
});

test("3. Arms hanging straight down returns valid: false and reason about moving arms away", () => {
  const pose = base();
  // wrists to x of shoulder, y = 0.52; elbows halfway
  // left shoulder is at 0.44, 0.24; right shoulder is at 0.56, 0.24
  pose[15] = { x: 0.44, y: 0.52, z: 0, visibility: 0.99 }; // left wrist
  pose[13] = { x: 0.44, y: (0.24 + 0.52) / 2, z: 0, visibility: 0.99 }; // left elbow
  pose[16] = { x: 0.56, y: 0.52, z: 0, visibility: 0.99 }; // right wrist
  pose[14] = { x: 0.56, y: (0.24 + 0.52) / 2, z: 0, visibility: 0.99 }; // right elbow

  const res = validateAPose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Move your arms slightly away from your body")));
});

test("4. Feet together returns valid: false and reason about feet", () => {
  const pose = base();
  // ankles at x = 0.48 and 0.52
  pose[27] = { x: 0.48, y: 0.90, z: 0, visibility: 0.99 };
  pose[28] = { x: 0.52, y: 0.90, z: 0, visibility: 0.99 };

  const res = validateAPose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.toLowerCase().includes("feet")));
});

test("5. Bent left elbow returns valid: false and reason about straightening arms", () => {
  const pose = base();
  // set point 13 to x = 0.375, y = 0.319
  pose[13] = { x: 0.375, y: 0.319, z: 0, visibility: 0.99 };

  const res = validateAPose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Straighten your arms")));
});

test("6. One ankle with visibility = 0.2 returns valid: false and reason about whole body being visible", () => {
  const pose = base();
  pose[27] = { ...pose[27], visibility: 0.2 };

  const res = validateAPose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Make sure your whole body is visible")));
});

test("7. An ankle at y = 0.995 returns valid: false and reason about stepping back", () => {
  const pose = base();
  pose[28] = { ...pose[28], y: 0.995 };

  const res = validateAPose(pose, { width: 1280, height: 720 });
  assert.equal(res.valid, false);
  assert.ok(res.reasons.some((r) => r.includes("Step back so your whole body fits")));
});
