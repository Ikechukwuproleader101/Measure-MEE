import test from "node:test";
import assert from "node:assert/strict";
import {
  captureReducer,
  INITIAL_CAPTURE_STATE,
  setHeightAction,
  goToStepAction,
  startCameraAction,
  setCaptureAction,
  cancelCameraAction,
  clearCaptureAction,
  startAnalysisAction,
  resetAction,
} from "./captureSession.js";

const createMockCapture = (view, source = "camera", valid = true) => ({
  view,
  source,
  imageBlob: {},
  previewUrl: `blob:http://localhost/${view}-123`,
  width: 1280,
  height: 720,
  landmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0 }),
  worldLandmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0 }),
  mask: { data: new Uint8Array(10), width: 10, height: 1 },
  capturedAt: Date.now(),
  valid,
  validationError: valid ? null : "Straighten your arms",
});

test("1. Front and side captures can be set in either order", () => {
  let state = INITIAL_CAPTURE_STATE;
  state = captureReducer(state, setHeightAction(175));
  state = captureReducer(state, goToStepAction("hub"));
  assert.equal(state.step, "hub");

  // Fill SIDE first
  const sideMock = createMockCapture("side", "upload");
  state = captureReducer(state, setCaptureAction("side", sideMock));
  assert.equal(state.side, sideMock);
  assert.equal(state.front, null);
  assert.equal(state.step, "hub");

  // Fill FRONT second
  const frontMock = createMockCapture("front", "camera");
  state = captureReducer(state, setCaptureAction("front", frontMock));
  assert.equal(state.front, frontMock);
  assert.equal(state.side, sideMock);
  assert.equal(state.step, "hub");
});

test("2. startAnalysis fails unless height, front, and side all exist", () => {
  let state = INITIAL_CAPTURE_STATE;

  // Missing everything
  state = captureReducer(state, startAnalysisAction());
  assert.equal(state.step, "height");

  // Height only
  state = captureReducer(state, setHeightAction(180));
  state = captureReducer(state, startAnalysisAction());
  assert.equal(state.step, "height");

  // Height and side only
  state = captureReducer(state, setCaptureAction("side", createMockCapture("side")));
  state = captureReducer(state, startAnalysisAction());
  assert.notEqual(state.step, "analyzing");

  // Height, side, and front present
  state = captureReducer(state, setCaptureAction("front", createMockCapture("front")));
  state = captureReducer(state, startAnalysisAction());
  assert.equal(state.step, "analyzing", "Should transition to analyzing when all 3 exist");
});

test("3. setCapture returns to hub and clears cameraView", () => {
  let state = INITIAL_CAPTURE_STATE;
  state = captureReducer(state, startCameraAction("front"));
  assert.equal(state.step, "camera");
  assert.equal(state.cameraView, "front");

  const frontCapture = createMockCapture("front");
  state = captureReducer(state, setCaptureAction("front", frontCapture));
  assert.equal(state.step, "hub");
  assert.equal(state.cameraView, null);
  assert.equal(state.front, frontCapture);
});

test("4. cancelCamera returns to hub with nothing else changed", () => {
  let state = INITIAL_CAPTURE_STATE;
  state = captureReducer(state, setHeightAction(170));
  const sideCapture = createMockCapture("side");
  state = captureReducer(state, setCaptureAction("side", sideCapture));

  state = captureReducer(state, startCameraAction("front"));
  assert.equal(state.step, "camera");
  assert.equal(state.cameraView, "front");

  state = captureReducer(state, cancelCameraAction());
  assert.equal(state.step, "hub");
  assert.equal(state.cameraView, null);
  assert.equal(state.side, sideCapture);
  assert.equal(state.front, null);
});

test("5. clearCapture clears only that slot and preserves the other", () => {
  let state = INITIAL_CAPTURE_STATE;
  const frontCapture = createMockCapture("front");
  const sideCapture = createMockCapture("side");

  state = captureReducer(state, setCaptureAction("front", frontCapture));
  state = captureReducer(state, setCaptureAction("side", sideCapture));

  state = captureReducer(state, clearCaptureAction("front"));
  assert.equal(state.front, null);
  assert.equal(state.side, sideCapture);
});

test("6. reset clears everything back to initial state", () => {
  let state = INITIAL_CAPTURE_STATE;
  state = captureReducer(state, setHeightAction(168));
  state = captureReducer(state, setCaptureAction("front", createMockCapture("front")));
  state = captureReducer(state, setCaptureAction("side", createMockCapture("side")));
  state = captureReducer(state, startAnalysisAction());
  assert.equal(state.step, "analyzing");

  state = captureReducer(state, resetAction());
  assert.deepEqual(state, INITIAL_CAPTURE_STATE);
});

test("7. Editing height keeps existing photos", () => {
  let state = INITIAL_CAPTURE_STATE;
  state = captureReducer(state, setHeightAction(170));
  const frontCapture = createMockCapture("front");
  const sideCapture = createMockCapture("side");
  state = captureReducer(state, setCaptureAction("front", frontCapture));
  state = captureReducer(state, setCaptureAction("side", sideCapture));

  // Edit height
  state = captureReducer(state, goToStepAction("height"));
  assert.equal(state.step, "height");
  assert.equal(state.front, frontCapture, "Front photo must be preserved when editing height");
  assert.equal(state.side, sideCapture, "Side photo must be preserved when editing height");

  state = captureReducer(state, setHeightAction(172));
  assert.equal(state.heightCm, 172);
  assert.equal(state.front, frontCapture);
  assert.equal(state.side, sideCapture);
});
