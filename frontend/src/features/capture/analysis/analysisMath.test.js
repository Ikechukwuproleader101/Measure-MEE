import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateOutlineCoverage,
  calculateMaskPixelHeight,
  calculateScale,
} from "./analysisMath.js";

test("1. Outline coverage check: 4% and 85% fail, 20% passes", () => {
  // 10x10 mask = 100 pixels
  const width = 10;
  const height = 10;
  const total = width * height;

  // 4% coverage (4 pixels) -> fail (< 5%)
  const data4 = new Uint8Array(total);
  data4[0] = data4[1] = data4[2] = data4[3] = 1;
  const res4 = calculateOutlineCoverage({ data: data4, width, height });
  assert.equal(res4.coverage, 0.04);
  assert.equal(res4.valid, false);

  // 20% coverage (20 pixels) -> pass (5% - 80%)
  const data20 = new Uint8Array(total);
  for (let i = 0; i < 20; i++) data20[i] = 1;
  const res20 = calculateOutlineCoverage({ data: data20, width, height });
  assert.equal(res20.coverage, 0.20);
  assert.equal(res20.valid, true);

  // 85% coverage (85 pixels) -> fail (> 80%)
  const data85 = new Uint8Array(total);
  for (let i = 0; i < 85; i++) data85[i] = 1;
  const res85 = calculateOutlineCoverage({ data: data85, width, height });
  assert.equal(res85.coverage, 0.85);
  assert.equal(res85.valid, false);
});

test("2. Pixel height from a mask: known top and bottom rows return correct span; empty returns 0", () => {
  const width = 10;
  const height = 20;
  const data = new Uint8Array(width * height);

  // Top pixel at row 4, bottom pixel at row 15
  data[4 * width + 5] = 1;
  data[15 * width + 5] = 1;

  // Expected span: 15 - 4 + 1 = 12 pixels
  const span = calculateMaskPixelHeight({ data, width, height });
  assert.equal(span, 12);

  // Empty mask
  const emptySpan = calculateMaskPixelHeight({ data: new Uint8Array(width * height), width, height });
  assert.equal(emptySpan, 0);

  // Null/undefined mask
  assert.equal(calculateMaskPixelHeight(null), 0);
});

test("3. Scale: cmPerPixel calculation and 40% height threshold", () => {
  // 170 cm height, 800 px pixel height in a 1000 px image (80% >= 40%)
  const res = calculateScale(170, 800, 1000);
  assert.equal(res.valid, true);
  assert.equal(res.cmPerPixel, 170 / 800); // 0.2125
  assert.equal(res.error, null);

  // Under 40% threshold: 300 px in a 1000 px image (30% < 40%) -> fail
  const tooSmall = calculateScale(170, 300, 1000);
  assert.equal(tooSmall.valid, false);
  assert.equal(tooSmall.cmPerPixel, null);
  assert.ok(tooSmall.error?.includes("less than 40%"));

  // Exactly 40%: 400 px in a 1000 px image -> pass
  const boundary = calculateScale(180, 400, 1000);
  assert.equal(boundary.valid, true);
  assert.equal(boundary.cmPerPixel, 180 / 400); // 0.45
});
