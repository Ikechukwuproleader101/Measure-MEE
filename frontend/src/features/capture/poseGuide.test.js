import test from "node:test";
import assert from "node:assert/strict";
import { guideState } from "./guideState.js";
import {
  GUIDE_KEYPOINTS,
  GUIDE_FIGURE_BOUNDS,
  placeGuide,
  parsePoseDebug,
  shouldDrawSkeleton,
  drawSkeletonOverlay,
} from "./poseGuide.js";
import { validateAPose } from "./validateAPose.js";
import { IDX } from "./poseConstants.js";

// -------------------------------------------------------------
// Test 1: guideState outputs for each input combination
// -------------------------------------------------------------
test("1. guideState: idle, invalid, and valid for each input combination", () => {
  // Idle: no person, not valid
  assert.equal(guideState({ personVisible: false, isValid: false }), "idle");
  assert.equal(guideState({}), "idle");
  assert.equal(guideState(), "idle");

  // Invalid: person in view, not valid
  assert.equal(guideState({ personVisible: true, isValid: false }), "invalid");

  // Valid: pose is valid (regardless of personVisible)
  assert.equal(guideState({ personVisible: true, isValid: true }), "valid");
  assert.equal(guideState({ personVisible: false, isValid: true }), "valid");
});

// -------------------------------------------------------------
// Test 2: placeGuide viewport placement and scaling
// -------------------------------------------------------------
test("2. placeGuide: 720x1280 video in 720x1280 box with cover", () => {
  const res = placeGuide({
    videoW: 720,
    videoH: 1280,
    boxW: 720,
    boxH: 1280,
    fit: "cover",
  });

  // fActual is ~0.733
  assert.ok(
    Math.abs(res.fActual - 0.733) < 0.001,
    `Expected fActual ~0.733, got ${res.fActual}`
  );
  assert.equal(res.warning, false);

  // Figure center (SVG 200, 309) is centered in the 720x1280 box
  const centerX = res.tx + 200 * res.k;
  const centerY = res.ty + 309 * res.k;
  assert.ok(Math.abs(centerX - 360) < 0.001, `centerX should be 360, got ${centerX}`);
  assert.ok(Math.abs(centerY - 640) < 0.001, `centerY should be 640, got ${centerY}`);
});

test("2. placeGuide: tall narrow box (390x844) with 720x1280 video and cover", () => {
  const boxW = 390;
  const boxH = 844;
  const res = placeGuide({
    videoW: 720,
    videoH: 1280,
    boxW,
    boxH,
    fit: "cover",
  });

  const margin = 0.03 * Math.min(boxW, boxH); // 11.7
  const left = res.tx + GUIDE_FIGURE_BOUNDS.left * res.k;
  const right = res.tx + GUIDE_FIGURE_BOUNDS.right * res.k;
  const top = res.ty + GUIDE_FIGURE_BOUNDS.top * res.k;
  const bottom = res.ty + GUIDE_FIGURE_BOUNDS.bottom * res.k;

  // Bounds must be within [margin, box - margin]
  assert.ok(left >= margin - 0.001, `left (${left}) must be >= margin (${margin})`);
  assert.ok(right <= boxW - margin + 0.001, `right (${right}) must be <= boxW - margin (${boxW - margin})`);
  assert.ok(top >= margin - 0.001, `top (${top}) must be >= margin (${margin})`);
  assert.ok(bottom <= boxH - margin + 0.001, `bottom (${bottom}) must be <= boxH - margin (${boxH - margin})`);

  // fActual should be >= 0.60, or warning set
  assert.ok(
    res.fActual >= 0.60 || res.warning === true,
    `Expected fActual >= 0.60 or warning set, got fActual=${res.fActual}, warning=${res.warning}`
  );
});

test("2. placeGuide: wide box with contain fit fits inside visible video area", () => {
  const boxW = 1920;
  const boxH = 600;
  const videoW = 720;
  const videoH = 1280;
  const res = placeGuide({
    videoW,
    videoH,
    boxW,
    boxH,
    fit: "contain",
  });

  // In contain, video is centered in box
  const cs = Math.min(boxW / videoW, boxH / videoH); // 600 / 1280 = 0.46875
  const visibleVideoW = videoW * cs; // 337.5
  const visibleVideoH = videoH * cs; // 600
  const videoLeft = (boxW - visibleVideoW) / 2; // 791.25
  const videoRight = videoLeft + visibleVideoW; // 1128.75
  const videoTop = (boxH - visibleVideoH) / 2; // 0
  const videoBottom = videoTop + visibleVideoH; // 600

  const left = res.tx + GUIDE_FIGURE_BOUNDS.left * res.k;
  const right = res.tx + GUIDE_FIGURE_BOUNDS.right * res.k;
  const top = res.ty + GUIDE_FIGURE_BOUNDS.top * res.k;
  const bottom = res.ty + GUIDE_FIGURE_BOUNDS.bottom * res.k;

  assert.ok(left >= videoLeft - 0.001, `Guide left (${left}) must be inside videoLeft (${videoLeft})`);
  assert.ok(right <= videoRight + 0.001, `Guide right (${right}) must be inside videoRight (${videoRight})`);
  assert.ok(top >= videoTop - 0.001, `Guide top (${top}) must be inside videoTop (${videoTop})`);
  assert.ok(bottom <= videoBottom + 0.001, `Guide bottom (${bottom}) must be inside videoBottom (${videoBottom})`);
});

// -------------------------------------------------------------
// Test 3: The guide must pass the checker
// -------------------------------------------------------------
test("3. Guide keypoints pass validateAPose with valid: true and no reasons", () => {
  const videoW = 720;
  const videoH = 1280;
  const s = 0.733 / 440;

  // Initialize 33 points with default centered values
  const landmarks = Array.from({ length: 33 }, () => ({
    x: 0.5,
    y: 0.5,
    z: 0,
    visibility: 0.99,
  }));

  // Map 11 guide keypoints to normalized coordinates
  for (const [name, [x, y]] of Object.entries(GUIDE_KEYPOINTS)) {
    const u = 0.5 + (x - 200) * s * (videoH / videoW);
    const v = 0.5 + (y - 309) * s;
    const idx = IDX[name];
    assert.ok(idx !== undefined, `Unknown landmark index for ${name}`);
    landmarks[idx] = { x: u, y: v, z: 0, visibility: 0.99 };
  }

  const result = validateAPose(landmarks, { width: videoW, height: videoH });
  assert.equal(result.valid, true, `Validation failed with reasons: ${result.reasons.join(", ")}`);
  assert.deepEqual(result.reasons, []);
});

// -------------------------------------------------------------
// Test 4: Skeleton hidden decision and drawing
// -------------------------------------------------------------
test("4. Skeleton hidden: with showSkeleton false, drawing functions are skipped", () => {
  assert.equal(shouldDrawSkeleton(false), false);
  assert.equal(shouldDrawSkeleton(true), true);
  assert.equal(shouldDrawSkeleton(), false);

  let getContextCalled = false;
  let clearRectCalled = false;

  const mockCanvas = {
    width: 720,
    height: 1280,
    getContext: () => {
      getContextCalled = true;
      return {
        clearRect: () => {
          clearRectCalled = true;
        },
      };
    },
  };

  const dummyLandmarks = [{ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }];

  // Call with showSkeleton: false
  const drawn = drawSkeletonOverlay(mockCanvas, dummyLandmarks, {
    showSkeleton: false,
  });

  assert.equal(drawn, false);
  assert.equal(getContextCalled, false);
  assert.equal(clearRectCalled, false);
});

// -------------------------------------------------------------
// Test 5: Debug flag parsing from URL string and Location objects
// -------------------------------------------------------------
test("5. Debug flag parsing: debug=pose enables it in search string or hash; anything else does not", () => {
  // Enabled via search query
  assert.equal(parsePoseDebug("https://example.com/camera?debug=pose"), true);
  assert.equal(parsePoseDebug("https://example.com/camera?step=1&debug=pose"), true);
  assert.equal(parsePoseDebug("?debug=pose"), true);
  assert.equal(parsePoseDebug({ search: "?debug=pose", hash: "" }), true);

  // Enabled via hash
  assert.equal(parsePoseDebug("https://example.com/#debug=pose"), true);
  assert.equal(parsePoseDebug("https://example.com/#/camera?debug=pose"), true);
  assert.equal(parsePoseDebug("#debug=pose"), true);
  assert.equal(parsePoseDebug({ search: "", hash: "#debug=pose" }), true);
  assert.equal(parsePoseDebug({ search: "", hash: "#/camera?debug=pose" }), true);

  // Disabled cases
  assert.equal(parsePoseDebug("https://example.com/camera"), false);
  assert.equal(parsePoseDebug("https://example.com/camera?debug=other"), false);
  assert.equal(parsePoseDebug("https://example.com/camera?pose=debug"), false);
  assert.equal(parsePoseDebug("https://example.com/#pose"), false);
  assert.equal(parsePoseDebug(""), false);
  assert.equal(parsePoseDebug(null), false);
  assert.equal(parsePoseDebug(undefined), false);
  assert.equal(parsePoseDebug({ search: "", hash: "" }), false);
});

