import test from "node:test";
import assert from "node:assert/strict";
import { placeGuide } from "./poseGuide.js";
import {
  fitToGuide,
  createHoldTracker,
  shouldCaptureAtZero,
  smoothJoints,
  boxToArtwork,
  artworkToBox,
} from "./fitToGuide.js";
import { GUIDE, IDX, FIT_CONFIG } from "./poseConstants.js";

// Helper functions for synthesizing test landmarks
function jointToBox(ax, ay, { tx, ty, k }) {
  return { x: tx + ax * k, y: ty + ay * k };
}

function boxToLandmark(bx, by, { videoW, videoH, boxW, boxH, cs, mirrored }) {
  let x = bx;
  if (mirrored) x = boxW - x;
  const u = (x - boxW / 2) / (videoW * cs) + 0.5;
  const v = (by - boxH / 2) / (videoH * cs) + 0.5;
  return { x: u, y: v, visibility: 0.99 };
}

function synthesizeLandmarks(jointMap, placement, { videoW, videoH, boxW, boxH, cs, mirrored = false }) {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  for (const [name, [ax, ay]] of Object.entries(jointMap)) {
    const idx = IDX[name];
    if (idx === undefined) continue;
    const boxPt = jointToBox(ax, ay, placement);
    landmarks[idx] = boxToLandmark(boxPt.x, boxPt.y, { videoW, videoH, boxW, boxH, cs, mirrored });
  }
  return landmarks;
}

function scaleLandmarks(jointMap, scaleFactor, placement, { videoW, videoH, boxW, boxH, cs, mirrored = false }) {
  const centerArtwork = [170, 275]; // approximate center of artwork
  const scaledJoints = {};
  for (const [name, [ax, ay]] of Object.entries(jointMap)) {
    scaledJoints[name] = [
      centerArtwork[0] + (ax - centerArtwork[0]) * scaleFactor,
      centerArtwork[1] + (ay - centerArtwork[1]) * scaleFactor,
    ];
  }
  return synthesizeLandmarks(scaledJoints, placement, { videoW, videoH, boxW, boxH, cs, mirrored });
}

function shiftLandmarks(jointMap, shiftBoxX, shiftBoxY, placement, { videoW, videoH, boxW, boxH, cs, mirrored = false }) {
  const landmarks = Array.from({ length: 33 }, () => ({ x: 0, y: 0, visibility: 0 }));
  for (const [name, [ax, ay]] of Object.entries(jointMap)) {
    const idx = IDX[name];
    if (idx === undefined) continue;
    const boxPt = jointToBox(ax, ay, placement);
    landmarks[idx] = boxToLandmark(boxPt.x + shiftBoxX, boxPt.y + shiftBoxY, {
      videoW,
      videoH,
      boxW,
      boxH,
      cs,
      mirrored,
    });
  }
  return landmarks;
}

// -------------------------------------------------------------
// Test 1: Perfect fit
// -------------------------------------------------------------
test("1. Perfect fit: matches built-in silhouette artwork joints perfectly", () => {
  const videoW = 720;
  const videoH = 1280;
  const boxW = 390;
  const boxH = 844;
  const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover", guide: GUIDE });
  const landmarks = synthesizeLandmarks(GUIDE.joints, placement, {
    videoW,
    videoH,
    boxW,
    boxH,
    cs: placement.cs,
    mirrored: false,
  });

  const res = fitToGuide({
    landmarks,
    placement,
    videoW,
    videoH,
    boxW,
    boxH,
    mirrored: false,
    guide: GUIDE,
    config: FIT_CONFIG,
  });

  assert.equal(res.pass, true);
  assert.equal(res.hint, "");
  assert.ok(Math.abs(res.ratio - 1.0) < 0.05, `Expected ratio ~1.0, got ${res.ratio}`);
  assert.ok(Math.abs(res.dx) < 5, `Expected dx < 5, got ${res.dx}`);
  assert.ok(Math.abs(res.dy) < 5, `Expected dy < 5, got ${res.dy}`);
});

// -------------------------------------------------------------
// Test 2: Scale
// -------------------------------------------------------------
test("2. Scale: 0.9 and 1.1 pass; 0.6 fails with closer; 1.5 fails with back", () => {
  const videoW = 720;
  const videoH = 1280;
  const boxW = 390;
  const boxH = 844;
  const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover", guide: GUIDE });

  // 0.9 pass
  const lm09 = scaleLandmarks(GUIDE.joints, 0.9, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res09 = fitToGuide({ landmarks: lm09, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res09.pass, true, "0.9 scale should pass");

  // 1.1 pass
  const lm11 = scaleLandmarks(GUIDE.joints, 1.1, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res11 = fitToGuide({ landmarks: lm11, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res11.pass, true, "1.1 scale should pass");

  // 0.6 fails with 'closer'
  const lm06 = scaleLandmarks(GUIDE.joints, 0.6, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res06 = fitToGuide({ landmarks: lm06, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res06.pass, false, "0.6 scale should fail");
  assert.match(res06.hint, /closer/i);

  // 1.5 fails with 'back'
  const lm15 = scaleLandmarks(GUIDE.joints, 1.5, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res15 = fitToGuide({ landmarks: lm15, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res15.pass, false, "1.5 scale should fail");
  assert.match(res15.hint, /back/i);
});

// -------------------------------------------------------------
// Test 3: Shift
// -------------------------------------------------------------
test("3. Shift: 5% box-width shift passes; 25% shift fails with left/center hint", () => {
  const videoW = 720;
  const videoH = 1280;
  const boxW = 390;
  const boxH = 844;
  const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover", guide: GUIDE });

  // 5% shift
  const lm5 = shiftLandmarks(GUIDE.joints, boxW * 0.05, 0, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res5 = fitToGuide({ landmarks: lm5, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res5.pass, true, "5% shift should pass");

  // 25% shift right
  const lm25 = shiftLandmarks(GUIDE.joints, boxW * 0.25, 0, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res25 = fitToGuide({ landmarks: lm25, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res25.pass, false, "25% shift should fail");
  assert.match(res25.hint, /left|center/i);
});

// -------------------------------------------------------------
// Test 4: Arms down
// -------------------------------------------------------------
test("4. Arms down: wrists straight below shoulders fails with arms hint", () => {
  const videoW = 720;
  const videoH = 1280;
  const boxW = 390;
  const boxH = 844;
  const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover", guide: GUIDE });

  const customJoints = { ...GUIDE.joints };
  // Put wrists straight down below shoulders in artwork space
  customJoints.leftWrist = [customJoints.leftShoulder[0], customJoints.leftShoulder[1] + 160];
  customJoints.rightWrist = [customJoints.rightShoulder[0], customJoints.rightShoulder[1] + 160];

  const landmarks = synthesizeLandmarks(customJoints, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res = fitToGuide({ landmarks, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res.pass, false);
  assert.match(res.hint, /arm/i);
});

// -------------------------------------------------------------
// Test 5: Feet far apart
// -------------------------------------------------------------
test("5. Feet far apart: ankles 2x apart fails with feet hint", () => {
  const videoW = 720;
  const videoH = 1280;
  const boxW = 390;
  const boxH = 844;
  const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover", guide: GUIDE });

  const customJoints = { ...GUIDE.joints };
  const centerX = 170;
  const lDist = customJoints.leftAnkle[0] - centerX;
  const rDist = customJoints.rightAnkle[0] - centerX;
  customJoints.leftAnkle = [centerX + lDist * 2.2, customJoints.leftAnkle[1]];
  customJoints.rightAnkle = [centerX + rDist * 2.2, customJoints.rightAnkle[1]];

  const landmarks = synthesizeLandmarks(customJoints, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res = fitToGuide({ landmarks, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res.pass, false);
  assert.match(res.hint, /feet/i);
});

// -------------------------------------------------------------
// Test 6: Allowed misses
// -------------------------------------------------------------
test("6. Allowed misses: 1 bad non-core joint passes, 2 fail", () => {
  const videoW = 720;
  const videoH = 1280;
  const boxW = 390;
  const boxH = 844;
  const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover", guide: GUIDE });

  // 1 bad non-core joint (leftElbow shifted by 80px in artwork space)
  const joints1Bad = { ...GUIDE.joints };
  joints1Bad.leftElbow = [joints1Bad.leftElbow[0] + 80, joints1Bad.leftElbow[1]];
  const lm1Bad = synthesizeLandmarks(joints1Bad, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res1Bad = fitToGuide({ landmarks: lm1Bad, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res1Bad.pass, true, "1 bad non-core joint should pass due to allowedMisses = 1");

  // 2 bad non-core joints (leftElbow and rightKnee shifted)
  const joints2Bad = { ...joints1Bad };
  joints2Bad.rightKnee = [joints2Bad.rightKnee[0] + 80, joints2Bad.rightKnee[1]];
  const lm2Bad = synthesizeLandmarks(joints2Bad, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  const res2Bad = fitToGuide({ landmarks: lm2Bad, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res2Bad.pass, false, "2 bad non-core joints should fail");
});

// -------------------------------------------------------------
// Test 7: Core visibility
// -------------------------------------------------------------
test("7. Core visibility: core joint with visibility < 0.4 fails with hint", () => {
  const videoW = 720;
  const videoH = 1280;
  const boxW = 390;
  const boxH = 844;
  const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover", guide: GUIDE });

  const landmarks = synthesizeLandmarks(GUIDE.joints, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });
  // Set nose visibility to 0.2
  landmarks[IDX.nose].visibility = 0.2;

  const res = fitToGuide({ landmarks, placement, videoW, videoH, boxW, boxH, guide: GUIDE });
  assert.equal(res.pass, false);
  assert.match(res.hint, /step back|body|visible/i);
});

// -------------------------------------------------------------
// Test 8: Mirrored preview
// -------------------------------------------------------------
test("8. Mirrored preview: passes with mirrored=true and mirror-agnostic pairing", () => {
  const videoW = 720;
  const videoH = 1280;
  const boxW = 390;
  const boxH = 844;
  const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover", guide: GUIDE });

  // Synthesize landmarks for mirrored camera
  const landmarksMirrored = synthesizeLandmarks(GUIDE.joints, placement, {
    videoW,
    videoH,
    boxW,
    boxH,
    cs: placement.cs,
    mirrored: true,
  });

  const res = fitToGuide({
    landmarks: landmarksMirrored,
    placement,
    videoW,
    videoH,
    boxW,
    boxH,
    mirrored: true,
    guide: GUIDE,
  });

  assert.equal(res.pass, true, "Mirrored landmarks with mirrored=true should pass");
  assert.equal(res.hint, "");
});

// -------------------------------------------------------------
// Test 9: Zone check at capture
// -------------------------------------------------------------
test("9. Zone check at capture: pose failing at 1.0 passes at captureRadiusScale (1.30)", () => {
  const videoW = 720;
  const videoH = 1280;
  const boxW = 390;
  const boxH = 844;
  const placement = placeGuide({ videoW, videoH, boxW, boxH, fit: "cover", guide: GUIDE });

  // Perturb 2 non-core joints (leftElbow and rightKnee) just outside their 1.0 radius (e.g. 1.15 * radius)
  const jointsBorderline = { ...GUIDE.joints };
  const figHArtwork = GUIDE.bounds.bottom - GUIDE.bounds.top;
  const elbowR = figHArtwork * (FIT_CONFIG.radius.leftElbow || 0.07);
  const kneeR = figHArtwork * (FIT_CONFIG.radius.rightKnee || 0.07);
  jointsBorderline.leftElbow = [jointsBorderline.leftElbow[0] + elbowR * 1.15, jointsBorderline.leftElbow[1]];
  jointsBorderline.rightKnee = [jointsBorderline.rightKnee[0] + kneeR * 1.15, jointsBorderline.rightKnee[1]];

  const landmarks = synthesizeLandmarks(jointsBorderline, placement, { videoW, videoH, boxW, boxH, cs: placement.cs });

  const resLive = fitToGuide({
    landmarks,
    placement,
    videoW,
    videoH,
    boxW,
    boxH,
    radiusScale: 1.0,
    guide: GUIDE,
  });
  assert.equal(resLive.pass, false, "Borderline pose should fail live (radiusScale=1.0)");

  const resCapture = fitToGuide({
    landmarks,
    placement,
    videoW,
    videoH,
    boxW,
    boxH,
    radiusScale: FIT_CONFIG.captureRadiusScale, // 1.30
    guide: GUIDE,
  });
  assert.equal(resCapture.pass, true, "Borderline pose should pass at capture (radiusScale=1.30)");
});

// -------------------------------------------------------------
// Test 10: createHoldTracker
// -------------------------------------------------------------
test("10. createHoldTracker: 300ms continuous pass turns valid; debounce; 250ms drops", () => {
  const tracker = createHoldTracker({ passHoldMs: 300, failHoldMs: 250 });
  assert.equal(tracker.isValid(), false);

  // Frame 1 at t=0: pass
  tracker.update(true, 0);
  assert.equal(tracker.isValid(), false);

  // Frame at t=200ms: still under 300ms
  tracker.update(true, 200);
  assert.equal(tracker.isValid(), false);

  // Frame at t=350ms: passes 300ms threshold -> valid!
  tracker.update(true, 350);
  assert.equal(tracker.isValid(), true);

  // Single false frame at t=400ms: debounce should keep state valid
  tracker.update(false, 400);
  assert.equal(tracker.isValid(), true);

  // Continuous fail for 250ms (from t=400 to t=660ms): should drop to invalid
  tracker.update(false, 500);
  assert.equal(tracker.isValid(), true);
  tracker.update(false, 660);
  assert.equal(tracker.isValid(), false);
});

// -------------------------------------------------------------
// Test 11: shouldCaptureAtZero
// -------------------------------------------------------------
test("11. shouldCaptureAtZero: valid now, valid 400ms ago, outside grace at 700ms", () => {
  const now = 10000;
  const graceMs = 500;

  // Case 1: valid right now
  assert.equal(
    shouldCaptureAtZero({ isValid: true, lastValidAtMs: now, nowMs: now, graceMs }),
    true
  );

  // Case 2: invalid now, but valid 400ms ago (within 500ms grace)
  assert.equal(
    shouldCaptureAtZero({ isValid: false, lastValidAtMs: now - 400, nowMs: now, graceMs }),
    true
  );

  // Case 3: invalid now, valid 700ms ago (outside 500ms grace)
  assert.equal(
    shouldCaptureAtZero({ isValid: false, lastValidAtMs: now - 700, nowMs: now, graceMs }),
    false
  );
});

// -------------------------------------------------------------
// Test 12: placeGuide
// -------------------------------------------------------------
test("12. placeGuide: whole figure fits with >= 3% margin for tall, square, wide boxes", () => {
  const testBoxes = [
    { name: "tall (9:16)", boxW: 390, boxH: 844 },
    { name: "square (1:1)", boxW: 600, boxH: 600 },
    { name: "wide (16:9)", boxW: 1280, boxH: 720 },
  ];

  for (const { name, boxW, boxH } of testBoxes) {
    for (const fit of ["cover", "contain"]) {
      const res = placeGuide({ videoW: 720, videoH: 1280, boxW, boxH, fit, guide: GUIDE });
      assert.ok(!Number.isNaN(res.k) && res.k > 0, `${name} ${fit}: k should be valid positive number`);
      assert.ok(!Number.isNaN(res.tx), `${name} ${fit}: tx should be valid number`);
      assert.ok(!Number.isNaN(res.ty), `${name} ${fit}: ty should be valid number`);

      // Figure bounding box in box pixels
      const topPx = res.ty + GUIDE.bounds.top * res.k;
      const bottomPx = res.ty + GUIDE.bounds.bottom * res.k;
      const leftPx = res.tx + GUIDE.bounds.left * res.k;
      const rightPx = res.tx + GUIDE.bounds.right * res.k;

      // Margins
      const topMargin = topPx;
      const bottomMargin = boxH - bottomPx;
      const leftMargin = leftPx;
      const rightMargin = boxW - rightPx;

      assert.ok(topMargin >= -1, `${name} ${fit}: top margin >= 0`);
      assert.ok(bottomMargin >= -1, `${name} ${fit}: bottom margin >= 0`);
      assert.ok(leftMargin >= -1, `${name} ${fit}: left margin >= 0`);
      assert.ok(rightMargin >= -1, `${name} ${fit}: right margin >= 0`);

      // Specifically check tall box has >= 3% top & bottom margin
      if (name.includes("tall")) {
        const minMargin = boxH * 0.03 - 1;
        assert.ok(topMargin >= minMargin, `Tall box top margin should be >= 3%`);
        assert.ok(bottomMargin >= minMargin, `Tall box bottom margin should be >= 3%`);
      }
    }
  }
});

// -------------------------------------------------------------
// Test 13: Smoothing helper
// -------------------------------------------------------------
test("13. Smoothing helper: smoothJoints with alpha=0.5 moves halfway; null prev returns curr", () => {
  const prev = {
    nose: { x: 100, y: 200, visibility: 0.9 },
  };
  const curr = {
    nose: { x: 120, y: 240, visibility: 0.95 },
  };

  const smoothed = smoothJoints(prev, curr, 0.5);
  assert.equal(smoothed.nose.x, 110);
  assert.equal(smoothed.nose.y, 220);

  const fromNull = smoothJoints(null, curr, 0.5);
  assert.equal(fromNull.nose.x, 120);
  assert.equal(fromNull.nose.y, 240);
});

// -------------------------------------------------------------
// Test 14: Record-pose math
// -------------------------------------------------------------
test("14. Record-pose math: boxToArtwork and artworkToBox roundtrip for mirrored and unmirrored", () => {
  const placement = { tx: 45, ty: 80, k: 0.85, boxW: 390 };
  const origArtPt = { x: 170, y: 240 };

  // Unmirrored
  const boxUnmirrored = artworkToBox(origArtPt.x, origArtPt.y, { ...placement, mirrored: false });
  const recoveredUnmirrored = boxToArtwork(boxUnmirrored.x, boxUnmirrored.y, { ...placement, mirrored: false });
  assert.ok(
    Math.abs(recoveredUnmirrored.x - origArtPt.x) < 0.01,
    `Unmirrored X roundtrip within 0.01: got ${recoveredUnmirrored.x}`
  );
  assert.ok(
    Math.abs(recoveredUnmirrored.y - origArtPt.y) < 0.01,
    `Unmirrored Y roundtrip within 0.01: got ${recoveredUnmirrored.y}`
  );

  // Mirrored
  const boxMirrored = artworkToBox(origArtPt.x, origArtPt.y, { ...placement, mirrored: true });
  const recoveredMirrored = boxToArtwork(boxMirrored.x, boxMirrored.y, { ...placement, mirrored: true });
  assert.ok(
    Math.abs(recoveredMirrored.x - origArtPt.x) < 0.01,
    `Mirrored X roundtrip within 0.01: got ${recoveredMirrored.x}`
  );
  assert.ok(
    Math.abs(recoveredMirrored.y - origArtPt.y) < 0.01,
    `Mirrored Y roundtrip within 0.01: got ${recoveredMirrored.y}`
  );
});
