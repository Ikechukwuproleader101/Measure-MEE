import test from "node:test";
import assert from "node:assert/strict";
import {
  captureReducer,
  INITIAL_CAPTURE_STATE,
  setHeightAction,
  goToStepAction,
  setCaptureAction,
  retakeAction,
  resetAction,
} from "./captureSession.js";

const createMockCapture = (view) => ({
  view,
  imageBlob: {},
  previewUrl: `blob:http://localhost/${view}-123`,
  width: 1280,
  height: 720,
  landmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0 }),
  worldLandmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0 }),
  mask: { data: new Uint8Array(10), width: 10, height: 1 },
  capturedAt: Date.now(),
});

test("1. side step cannot start without front capture", () => {
  let state = INITIAL_CAPTURE_STATE;
  state = captureReducer(state, setHeightAction(175));
  state = captureReducer(state, goToStepAction("prep"));
  assert.equal(state.step, "prep");

  // Attempt to jump straight to side without front
  state = captureReducer(state, goToStepAction("side"));
  assert.equal(state.step, "prep", "Step must not change to side without front capture");

  // Now set front capture
  const frontMock = createMockCapture("front");
  state = captureReducer(state, setCaptureAction("front", frontMock));
  state = captureReducer(state, goToStepAction("side"));
  assert.equal(state.step, "side", "Step can now transition to side");
});

test("2. done is unreachable unless height, front, and side are all present", () => {
  let state = INITIAL_CAPTURE_STATE;

  // No height, no front, no side
  state = captureReducer(state, goToStepAction("done"));
  assert.equal(state.step, "height");

  // Only height
  state = captureReducer(state, setHeightAction(180));
  state = captureReducer(state, goToStepAction("done"));
  assert.equal(state.step, "height");

  // Height and front only
  state = captureReducer(state, setCaptureAction("front", createMockCapture("front")));
  state = captureReducer(state, goToStepAction("done"));
  assert.equal(state.step, "height");

  // Height, front, and side all present
  state = captureReducer(state, setCaptureAction("side", createMockCapture("side")));
  state = captureReducer(state, goToStepAction("done"));
  assert.equal(state.step, "done", "Done is reached once all prerequisites exist");
});

test("3. retake clears only that view and navigates back to view step", () => {
  let state = INITIAL_CAPTURE_STATE;
  state = captureReducer(state, setHeightAction(170));
  const frontCapture = createMockCapture("front");
  const sideCapture = createMockCapture("side");

  state = captureReducer(state, setCaptureAction("front", frontCapture));
  state = captureReducer(state, setCaptureAction("side", sideCapture));
  state = captureReducer(state, goToStepAction("reviewSide"));

  // Retake side
  state = captureReducer(state, retakeAction("side"));
  assert.equal(state.side, null, "Side capture must be cleared");
  assert.equal(state.front, frontCapture, "Front capture must remain untouched");
  assert.equal(state.step, "side", "Step must return to side");

  // Retake front
  state = captureReducer(state, retakeAction("front"));
  assert.equal(state.front, null, "Front capture must be cleared");
  assert.equal(state.step, "front", "Step must return to front");
});

test("4. reset clears everything back to initial state", () => {
  let state = INITIAL_CAPTURE_STATE;
  state = captureReducer(state, setHeightAction(168));
  state = captureReducer(state, setCaptureAction("front", createMockCapture("front")));
  state = captureReducer(state, setCaptureAction("side", createMockCapture("side")));
  state = captureReducer(state, goToStepAction("done"));

  assert.equal(state.step, "done");
  assert.equal(state.heightCm, 168);

  state = captureReducer(state, resetAction());
  assert.deepEqual(state, INITIAL_CAPTURE_STATE);
});
