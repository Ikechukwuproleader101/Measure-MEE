import test from "node:test";
import assert from "node:assert/strict";
import { runAnalysis } from "./runAnalysis.js";

const createValidFakeCapture = (width = 100, height = 200) => {
  const data = new Uint8Array(width * height);
  // Fill 20% of pixels in the center (rows 40 to 160)
  for (let y = 40; y < 160; y++) {
    for (let x = 30; x < 60; x++) {
      data[y * width + x] = 1;
    }
  }

  return {
    width,
    height,
    landmarks: Array(33).fill({ x: 0.5, y: 0.5, z: 0, visibility: 0.99 }),
    mask: { data, width, height },
  };
};

test("1. runAnalysis reports stages in order and completes successfully with valid captures", async () => {
  const recordedStages = [];
  const onStage = (id, state, detail) => {
    recordedStages.push({ id, state, detail });
  };

  const front = createValidFakeCapture(100, 200);
  const side = createValidFakeCapture(100, 200);

  const res = await runAnalysis({ heightCm: 175, front, side }, onStage);

  assert.equal(res.ok, true);
  assert.ok(typeof res.frontScale === "number");
  assert.ok(typeof res.sideScale === "number");
  assert.ok(res.message?.includes("Measurement calculation is the next step"));

  // Check stage sequence
  const stageIds = recordedStages.map((s) => s.id);
  assert.deepEqual(stageIds, [
    "photos",
    "photos",
    "outline",
    "outline",
    "scale",
    "scale",
    "measure",
    "measure",
  ]);

  const activeDone = recordedStages.map((s) => `${s.id}:${s.state}`);
  assert.deepEqual(activeDone, [
    "photos:active",
    "photos:done",
    "outline:active",
    "outline:done",
    "scale:active",
    "scale:done",
    "measure:active",
    "measure:done",
  ]);
});

test("2. A failing stage stops later stages from running", async () => {
  const recordedStages = [];
  const onStage = (id, state, detail) => {
    recordedStages.push({ id, state, detail });
  };

  // Missing landmarks on side photo
  const front = createValidFakeCapture(100, 200);
  const badSide = {
    ...createValidFakeCapture(100, 200),
    landmarks: [], // missing
  };

  const res = await runAnalysis({ heightCm: 175, front, side: badSide }, onStage);

  assert.equal(res.ok, false);
  assert.equal(res.failedStage, "photos");

  // Only photos stage was touched; outline, scale, measure were NOT reached
  const stageIds = Array.from(new Set(recordedStages.map((s) => s.id)));
  assert.deepEqual(stageIds, ["photos"]);
});

test("3. Outline failure stops pipeline and returns plain words explanation", async () => {
  const recordedStages = [];
  const onStage = (id, state, detail) => {
    recordedStages.push({ id, state, detail });
  };

  // 1% outline coverage on front (fails 5%-80% check)
  const tinyFront = {
    ...createValidFakeCapture(100, 200),
    mask: { data: new Uint8Array(20000), width: 100, height: 200 }, // 0%
  };
  const side = createValidFakeCapture(100, 200);

  const res = await runAnalysis({ heightCm: 175, front: tinyFront, side }, onStage);

  assert.equal(res.ok, false);
  assert.equal(res.failedStage, "outline");
  assert.ok(res.error?.includes("plainer background"));

  // Scale and measure were not run
  const stageIds = Array.from(new Set(recordedStages.map((s) => s.id)));
  assert.deepEqual(stageIds, ["photos", "outline"]);
});
