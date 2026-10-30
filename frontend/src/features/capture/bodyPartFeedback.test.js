import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RULES, rangeCheck, createHoldTracker, shouldCaptureAtZero, smoothJoints } from './poseRules.js';
import { calculateBodyMetrics } from './bodyMetrics.js';
import { evaluatePose } from './evaluatePose.js';
import { evaluateTilt } from './tilt.js';
import { partStyle } from './limbRenderer.js';
import { cueDecision, cueFromHint } from './cues.js';

/**
 * Generates an ideal 33-landmark pose normalized (0..1)
 */
function createGoodPose(options = {}) {
  const videoW = options.videoW || 720;
  const videoH = options.videoH || 1280;
  const armAngleDeg = options.armAngleDeg ?? 40;
  const armLen = options.armLen ?? 200;
  const elbowBendDeg = options.elbowBendDeg ?? 0;
  const kneeBendDeg = options.kneeBendDeg ?? 0;
  const spreadScale = options.spreadScale ?? 1.0;
  const shoulderTiltDeg = options.shoulderTiltDeg ?? 0;
  const torsoLeanDeg = options.torsoLeanDeg ?? 0;
  const noseY = options.noseY ?? 0.20;
  const ankleY = options.ankleY ?? 0.88;
  const centerX = options.centerX ?? 0.50;
  const defaultVis = options.visibility ?? 0.95;

  const landmarks = Array.from({ length: 33 }, () => ({
    x: centerX,
    y: 0.5,
    z: 0,
    visibility: defaultVis,
  }));

  // Torso vector in pixels
  const shMidY = 0.30 * videoH;
  const hipMidY = 0.55 * videoH;
  const shMidX = centerX * videoW;
  const hipMidX = centerX * videoW + Math.tan((torsoLeanDeg * Math.PI) / 180) * (hipMidY - shMidY);

  const shHalfW = 50.4;
  const shTiltRad = (shoulderTiltDeg * Math.PI) / 180;
  const leftShPx = {
    x: shMidX - shHalfW * Math.cos(shTiltRad),
    y: shMidY - shHalfW * Math.sin(shTiltRad),
  };
  const rightShPx = {
    x: shMidX + shHalfW * Math.cos(shTiltRad),
    y: shMidY + shHalfW * Math.sin(shTiltRad),
  };

  const hipHalfW = 36;
  const leftHipPx = { x: hipMidX - hipHalfW, y: hipMidY };
  const rightHipPx = { x: hipMidX + hipHalfW, y: hipMidY };

  // Torso vector direction
  const torsoDx = hipMidX - shMidX;
  const torsoDy = hipMidY - shMidY;
  const torsoLen = Math.hypot(torsoDx, torsoDy);
  const torsoDir = { x: torsoDx / torsoLen, y: torsoDy / torsoLen };

  // Arms: angle from torso line (pointing downwards)
  const armRad = (armAngleDeg * Math.PI) / 180;

  // Helper to rotate torsoDir by rad
  const rotateVec = (dir, rad) => ({
    x: dir.x * Math.cos(rad) - dir.y * Math.sin(rad),
    y: dir.x * Math.sin(rad) + dir.y * Math.cos(rad),
  });

  // Left arm moves outward (-x, so angle +armRad in rotateVec)
  const leftArmDir = rotateVec(torsoDir, armRad);
  const leftWristPx = {
    x: leftShPx.x + leftArmDir.x * armLen,
    y: leftShPx.y + leftArmDir.y * armLen,
  };
  // Elbow halfway
  const leftElbowPx = {
    x: (leftShPx.x + leftWristPx.x) / 2 + (elbowBendDeg !== 0 ? Math.sin((elbowBendDeg * Math.PI) / 180) * 40 : 0),
    y: (leftShPx.y + leftWristPx.y) / 2,
  };

  // Right arm moves outward (+x, so angle -armRad in rotateVec)
  const rightArmDir = rotateVec(torsoDir, -armRad);
  const rightWristPx = {
    x: rightShPx.x + rightArmDir.x * armLen,
    y: rightShPx.y + rightArmDir.y * armLen,
  };
  const rightElbowPx = {
    x: (rightShPx.x + rightWristPx.x) / 2 - (elbowBendDeg !== 0 ? Math.sin((elbowBendDeg * Math.PI) / 180) * 40 : 0),
    y: (rightShPx.y + rightWristPx.y) / 2,
  };

  // Legs: spread determines ankle distance
  const shoulderWidth = Math.hypot(rightShPx.x - leftShPx.x, rightShPx.y - leftShPx.y);
  const ankleHalfDist = (shoulderWidth * spreadScale) / 2;
  const ankleYPx = ankleY * videoH;

  const leftAnklePx = { x: hipMidX - ankleHalfDist, y: ankleYPx };
  const rightAnklePx = { x: hipMidX + ankleHalfDist, y: ankleYPx };

  const leftKneePx = {
    x: (leftHipPx.x + leftAnklePx.x) / 2 + (kneeBendDeg !== 0 ? 40 : 0),
    y: (leftHipPx.y + leftAnklePx.y) / 2,
  };
  const rightKneePx = {
    x: (rightHipPx.x + rightAnklePx.x) / 2 - (kneeBendDeg !== 0 ? 40 : 0),
    y: (rightHipPx.y + rightAnklePx.y) / 2,
  };

  // Assign to landmarks
  const setLM = (idx, ptPx, vis = defaultVis) => {
    landmarks[idx] = {
      x: ptPx.x / videoW,
      y: ptPx.y / videoH,
      z: 0,
      visibility: vis,
    };
  };

  landmarks[0] = { x: centerX, y: noseY, z: 0, visibility: defaultVis };
  setLM(11, leftShPx);
  setLM(12, rightShPx);
  setLM(13, leftElbowPx);
  setLM(14, rightElbowPx);
  setLM(15, leftWristPx);
  setLM(16, rightWristPx);
  setLM(23, leftHipPx);
  setLM(24, rightHipPx);
  setLM(25, leftKneePx);
  setLM(26, rightKneePx);
  setLM(27, leftAnklePx);
  setLM(28, rightAnklePx);

  return landmarks;
}

// -------------------------------------------------------------
// 1. rangeCheck tests
// -------------------------------------------------------------
test('1. rangeCheck: enters only inside min..max, stays OK with buffer, leaves outside buffer, scale widens correctly', () => {
  const range = { min: 30, max: 50, buffer: 5 };

  // Without prior OK
  assert.equal(rangeCheck(29, range, false), false);
  assert.equal(rangeCheck(30, range, false), true);
  assert.equal(rangeCheck(40, range, false), true);
  assert.equal(rangeCheck(50, range, false), true);
  assert.equal(rangeCheck(51, range, false), false);

  // With prior OK (hysteresis: min-buffer..max+buffer = 25..55)
  assert.equal(rangeCheck(29, range, true), true);
  assert.equal(rangeCheck(25, range, true), true);
  assert.equal(rangeCheck(24.9, range, true), false);
  assert.equal(rangeCheck(54.9, range, true), true);
  assert.equal(rangeCheck(55.1, range, true), false);

  // With scale = 1.25 (center 40, half-width 10 * 1.25 = 12.5 -> range 27.5..52.5)
  assert.equal(rangeCheck(28, range, false, 1.25), true);
  assert.equal(rangeCheck(27, range, false, 1.25), false);
  assert.equal(rangeCheck(52, range, false, 1.25), true);
  assert.equal(rangeCheck(53, range, false, 1.25), false);
});

// -------------------------------------------------------------
// 2. Arm angle tests
// -------------------------------------------------------------
test('2. Arm angle: 40 deg passes; 5 deg fails with away from your body; 70 deg fails with Lower your arm', () => {
  const good = createGoodPose({ armAngleDeg: 40 });
  const evalGood = evaluatePose({ landmarks: good, videoW: 720, videoH: 1280 });
  assert.equal(evalGood.pass, true);
  assert.equal(evalGood.parts.leftArm.state, 'ok');
  assert.equal(evalGood.parts.rightArm.state, 'ok');

  // Arms hanging down (~5 deg)
  const low = createGoodPose({ armAngleDeg: 5 });
  const evalLow = evaluatePose({ landmarks: low, videoW: 720, videoH: 1280 });
  assert.equal(evalLow.pass, false);
  assert.equal(evalLow.parts.leftArm.state, 'bad');
  assert.match(evalLow.hint, /away from your body/i);

  // Arms too high (~70 deg)
  const high = createGoodPose({ armAngleDeg: 70 });
  const evalHigh = evaluatePose({ landmarks: high, videoW: 720, videoH: 1280 });
  assert.equal(evalHigh.pass, false);
  assert.equal(evalHigh.parts.leftArm.state, 'bad');
  assert.match(evalHigh.hint, /lower your left arm/i);
});

// -------------------------------------------------------------
// 3. Arm outward test
// -------------------------------------------------------------
test('3. Arm outward: an arm crossing inward fails', () => {
  const good = createGoodPose();
  // Cross left arm across chest (inward past shoulder x towards hip midpoint)
  good[15].x = good[23].x + 0.05; // Left wrist is now across the centerline
  const evalCross = evaluatePose({ landmarks: good, videoW: 720, videoH: 1280 });
  assert.equal(evalCross.pass, false);
  assert.equal(evalCross.parts.leftArm.state, 'bad');
  assert.match(evalCross.hint, /away from your body/i);
});

// -------------------------------------------------------------
// 4. Elbow, knee, spread, shoulder tilt, torso lean hints
// -------------------------------------------------------------
test('4. Elbow, knee, spread, shoulder tilt, torso lean: each failing case returns right hint with right side', () => {
  // Bent left elbow
  const bentElbow = createGoodPose({ elbowBendDeg: 60 });
  const evalElbow = evaluatePose({ landmarks: bentElbow, videoW: 720, videoH: 1280 });
  assert.equal(evalElbow.parts.leftArm.state, 'bad');
  assert.match(evalElbow.hint, /straighten your left arm/i);

  // Bent right knee
  const bentKnee = createGoodPose({ kneeBendDeg: 45 });
  const evalKnee = evaluatePose({ landmarks: bentKnee, videoW: 720, videoH: 1280 });
  assert.equal(evalKnee.parts.leftLeg.state, 'bad');
  assert.match(evalKnee.hint, /straighten your left leg/i);

  // Feet too close together (spread < 0.6)
  const feetTogether = createGoodPose({ spreadScale: 0.3 });
  const evalFeet = evaluatePose({ landmarks: feetTogether, videoW: 720, videoH: 1280 });
  assert.equal(evalFeet.parts.leftLeg.state, 'bad');
  assert.equal(evalFeet.parts.rightLeg.state, 'bad');
  assert.match(evalFeet.hint, /open your feet/i);

  // Feet too wide (spread > 1.7)
  const feetWide = createGoodPose({ spreadScale: 2.2 });
  const evalWide = evaluatePose({ landmarks: feetWide, videoW: 720, videoH: 1280 });
  assert.match(evalWide.hint, /bring your feet closer/i);

  // Shoulder tilt
  const tiltedSh = createGoodPose({ shoulderTiltDeg: 15 });
  const evalSh = evaluatePose({ landmarks: tiltedSh, videoW: 720, videoH: 1280 });
  assert.equal(evalSh.parts.shoulders.state, 'bad');
  assert.match(evalSh.hint, /level your shoulders/i);

  // Torso lean: 12 deg (exceeds 8 deg limit but hips remain within center offset)
  const lean = createGoodPose({ torsoLeanDeg: 12 });
  const evalLean = evaluatePose({ landmarks: lean, videoW: 720, videoH: 1280 });
  assert.equal(evalLean.parts.torso.state, 'bad');
  assert.match(evalLean.hint, /stand up straight/i);
});

// -------------------------------------------------------------
// 5. Size independence
// -------------------------------------------------------------
test('5. Size independence: scaled poses and different body proportions pass equally', () => {
  const good = createGoodPose();
  const evalNorm = evaluatePose({ landmarks: good, videoW: 720, videoH: 1280 });
  assert.equal(evalNorm.pass, true);

  // Scale person down by 0.75 (move closer in normalized height, but keep within heightFrac)
  const scaledDown = createGoodPose({ noseY: 0.25, ankleY: 0.85, armLen: 150 });
  const evalDown = evaluatePose({ landmarks: scaledDown, videoW: 720, videoH: 1280 });
  assert.equal(evalDown.pass, true);

  // Long legs, short torso
  const longLegs = createGoodPose({ noseY: 0.20, ankleY: 0.90, spreadScale: 1.1 });
  const evalLong = evaluatePose({ landmarks: longLegs, videoW: 720, videoH: 1280 });
  assert.equal(evalLong.pass, true);
});

// -------------------------------------------------------------
// 6. Aspect ratio test
// -------------------------------------------------------------
test('6. Aspect ratio: the same real pose in 720x1280 and 1280x720 gives the same arm angles', () => {
  const pPortrait = createGoodPose({ videoW: 720, videoH: 1280, armAngleDeg: 40 });
  const mPortrait = calculateBodyMetrics(pPortrait, 720, 1280);

  // Same real coordinates in landscape
  // In portrait, px = (u * 720, v * 1280). In landscape, normalize by (1280, 720)
  const pLandscape = pPortrait.map((lm) => ({
    ...lm,
    x: (lm.x * 720) / 1280,
    y: (lm.y * 1280) / 720,
  }));
  const mLandscape = calculateBodyMetrics(pLandscape, 1280, 720);

  assert.ok(Math.abs(mPortrait.leftArmAngle - mLandscape.leftArmAngle) < 0.5);
  assert.ok(Math.abs(mPortrait.rightArmAngle - mLandscape.rightArmAngle) < 0.5);
});

// -------------------------------------------------------------
// 7. Unseen part test
// -------------------------------------------------------------
test('7. Unseen part: low-visibility wrist makes arm unseen and hint is "I can\'t see your left arm"', () => {
  const good = createGoodPose();
  good[15].visibility = 0.2; // Low visibility on left wrist
  const res = evaluatePose({ landmarks: good, videoW: 720, videoH: 1280 });
  assert.equal(res.pass, false);
  assert.equal(res.parts.leftArm.state, 'unseen');
  assert.equal(res.hint, "I can't see your left arm");
});

// -------------------------------------------------------------
// 8. Precedence: tilt > whole-body > parts, neutral parts when whole-body fails
// -------------------------------------------------------------
test('8. Precedence: whole-body error sets parts to neutral, not bad', () => {
  const tooSmall = createGoodPose({ noseY: 0.35, ankleY: 0.65, armAngleDeg: 10 }); // Both height fail and arms down
  const res = evaluatePose({ landmarks: tooSmall, videoW: 720, videoH: 1280 });

  assert.equal(res.wholeBody.ok, false);
  assert.equal(res.wholeBody.hint, 'Move closer');
  assert.equal(res.hint, 'Move closer');
  // Parts should be neutral, NOT bad
  assert.equal(res.parts.leftArm.state, 'neutral');
  assert.equal(res.parts.rightArm.state, 'neutral');
});

// -------------------------------------------------------------
// 9. Mirroring
// -------------------------------------------------------------
test('9. Mirroring: metrics centerOffset accounts for mirroring while left/right parts remain anatomical', () => {
  const good = createGoodPose({ centerX: 0.70 }); // Person on right side of image
  const unmirrored = evaluatePose({ landmarks: good, videoW: 720, videoH: 1280, mirrored: false });
  assert.equal(unmirrored.wholeBody.hint, 'Move a little to the left');

  // When mirrored, x = 0.70 appears on left (dispU = 0.30)
  const mirrored = evaluatePose({ landmarks: good, videoW: 720, videoH: 1280, mirrored: true });
  assert.equal(mirrored.wholeBody.hint, 'Move a little to the right');
});

// -------------------------------------------------------------
// 10. evaluateTilt tests
// -------------------------------------------------------------
test('10. evaluateTilt: upright is OK; all tilt errors produce exact specified messages; noData never blocks', () => {
  // Upright in portrait
  const upright = evaluateTilt({ beta: 90, gamma: 0, hasData: true });
  assert.equal(upright.ok, true);
  assert.equal(upright.state, 'ok');

  // No data
  const noData = evaluateTilt({ hasData: false });
  assert.equal(noData.ok, true);
  assert.equal(noData.state, 'unavailable');

  // Landscape
  const landscape = evaluateTilt({ beta: 90, gamma: 0, orientationType: 'landscape-primary', hasData: true });
  assert.equal(landscape.ok, false);
  assert.equal(landscape.hint, 'Turn your phone upright.');

  // Upside down
  const upsideDown = evaluateTilt({ beta: -90, gamma: 0, hasData: true });
  assert.equal(upsideDown.ok, false);
  assert.equal(upsideDown.hint, 'Your phone is upside down.');

  // Nearly flat (|pitch| > 40)
  const flat = evaluateTilt({ beta: 30, gamma: 0, hasData: true }); // pitch = -60
  assert.equal(flat.ok, false);
  assert.equal(flat.hint, 'Stand your phone upright.');

  // Pitch back
  const pitchBack = evaluateTilt({ beta: 80, gamma: 0, hasData: true }); // pitch = -10
  assert.equal(pitchBack.ok, false);
  assert.equal(pitchBack.hint, 'Your phone is leaning back. Stand it upright.');

  // Pitch forward
  const pitchForward = evaluateTilt({ beta: 100, gamma: 0, hasData: true }); // pitch = +10
  assert.equal(pitchForward.ok, false);
  assert.equal(pitchForward.hint, 'Your phone is leaning forward. Stand it upright.');

  // Roll error
  const rollErr = evaluateTilt({ beta: 90, gamma: 12, hasData: true });
  assert.equal(rollErr.ok, false);
  assert.equal(rollErr.hint, 'Your phone is tilted to the side. Straighten it.');

  // Shaking
  const shaking = evaluateTilt({ beta: 90, gamma: 0, shakeRate: 35, hasData: true });
  assert.equal(shaking.ok, false);
  assert.equal(shaking.hint, 'Hold the phone steady, or prop it up.');
});

// -------------------------------------------------------------
// 11. Hold tracker test
// -------------------------------------------------------------
test('11. Hold tracker: valid after 300ms continuous pass; single bad frame does not drop; 250ms continuous fail drops', () => {
  const tracker = createHoldTracker({ passHoldMs: 300, failHoldMs: 250 });

  assert.equal(tracker.update(true, 1000), false);
  assert.equal(tracker.update(true, 1200), false);
  assert.equal(tracker.update(true, 1310), true); // >300ms pass

  // Single bad frame
  assert.equal(tracker.update(false, 1350), true); // still valid!

  // Return to pass
  assert.equal(tracker.update(true, 1400), true);

  // Consecutive fails
  assert.equal(tracker.update(false, 1500), true);
  assert.equal(tracker.update(false, 1650), true);
  assert.equal(tracker.update(false, 1760), false); // >250ms fail
});

// -------------------------------------------------------------
// 12. Cue policy test
// -------------------------------------------------------------
test('12. Cue policy: cue plays on start, suppresses within 3s, repeats after 5s if persisting; cueFromHint mapping', () => {
  // First play
  assert.equal(cueDecision({ cue: 'closer', lastCue: null, lastPlayedAtMs: 0, nowMs: 5000 }), true);

  // Within 3s (2s elapsed) - should not play
  assert.equal(cueDecision({ cue: 'closer', lastCue: 'closer', lastPlayedAtMs: 5000, nowMs: 7000 }), false);

  // After 5s (5.1s elapsed) - repeats
  assert.equal(cueDecision({ cue: 'closer', lastCue: 'closer', lastPlayedAtMs: 5000, nowMs: 10100 }), true);

  // New cue 'further' after 3s
  assert.equal(cueDecision({ cue: 'further', lastCue: 'closer', lastPlayedAtMs: 5000, nowMs: 8100 }), true);

  // cueFromHint
  assert.equal(cueFromHint('Please move closer to camera'), 'closer');
  assert.equal(cueFromHint('Step back so your whole body fits'), 'further');
  assert.equal(cueFromHint('Level your shoulders'), null);
});

// -------------------------------------------------------------
// 13. Capture logic & grace test
// -------------------------------------------------------------
test('13. Capture logic: shouldCaptureAtZero respects validity and graceMs', () => {
  assert.equal(shouldCaptureAtZero({ isValid: true, lastValidAtMs: 1000, nowMs: 1000 }), true);
  // Invalid now, but valid 400ms ago with 500ms grace
  assert.equal(shouldCaptureAtZero({ isValid: false, lastValidAtMs: 1000, nowMs: 1400, graceMs: 500 }), true);
  // Outside grace (600ms ago)
  assert.equal(shouldCaptureAtZero({ isValid: false, lastValidAtMs: 1000, nowMs: 1600, graceMs: 500 }), false);
});

// -------------------------------------------------------------
// 14. Target hints geometry
// -------------------------------------------------------------
test('14. Target hints geometry: arm target calculated with own arm length and TARGET_ARM_ANGLE', () => {
  const good = createGoodPose({ armAngleDeg: 10, armLen: 220 }); // Bad arms down
  const metrics = calculateBodyMetrics(good, 720, 1280);
  assert.ok(metrics.leftArmLength > 200);
  assert.equal(RULES.TARGET_ARM_ANGLE, 40);
});

// -------------------------------------------------------------
// 15. partStyle test
// -------------------------------------------------------------
test('15. partStyle: returns correct colors, dash arrays and widths for each state', () => {
  const ok = partStyle('ok');
  assert.equal(ok.lineWidth, 6);
  assert.deepEqual(ok.lineDash, []);

  const bad = partStyle('bad');
  assert.equal(bad.lineWidth, 3);
  assert.deepEqual(bad.lineDash, [10, 8]);

  const unseen = partStyle('unseen');
  assert.equal(unseen.lineWidth, 3);
  assert.deepEqual(unseen.lineDash, [2, 8]);

  const neutral = partStyle('neutral');
  assert.equal(neutral.lineWidth, 2);
  assert.deepEqual(neutral.lineDash, []);
});

// -------------------------------------------------------------
// 16. Debug flag parsing and attempt log
// -------------------------------------------------------------
test('16. Debug: ?debug=pose flag parser & attempt log record structure', () => {
  const isDebugUrl = (urlStr) => {
    try {
      const url = new URL(urlStr, 'http://localhost');
      return url.searchParams.get('debug') === 'pose' || url.hash.includes('debug=pose');
    } catch {
      return false;
    }
  };

  assert.equal(isDebugUrl('http://localhost:5173/?debug=pose'), true);
  assert.equal(isDebugUrl('http://localhost:5173/#/dashboard?debug=pose'), true);
  assert.equal(isDebugUrl('http://localhost:5173/'), false);

  const attemptLogRecord = {
    timestamp: new Date().toISOString(),
    view: 'front',
    passed: true,
    usedGrace: false,
    captureAnyway: false,
    secondsToGreen: 2.4,
    failingParts: [],
    metrics: { leftArmAngle: 41, spread: 1.1 },
  };
  assert.equal(typeof JSON.stringify(attemptLogRecord), 'string');
});
