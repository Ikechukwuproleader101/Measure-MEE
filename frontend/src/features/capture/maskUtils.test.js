import test from "node:test";
import assert from "node:assert/strict";
import { convertFloatMaskToBinary, processSegmentationMask } from "./maskUtils.js";

test("1. Values strictly above 0.5 become 1, 0.5 and below become 0", () => {
  const input = new Float32Array([0.0, 0.49, 0.5, 0.5001, 0.8, 1.0, -0.2]);
  const output = convertFloatMaskToBinary(input);

  assert.ok(output instanceof Uint8Array, "Output must be a Uint8Array");
  assert.equal(output.length, input.length, "Length must be preserved");
  assert.deepEqual(Array.from(output), [0, 0, 0, 1, 1, 1, 0]);
});

test("2. Empty and null inputs produce valid empty Uint8Array", () => {
  const empty = convertFloatMaskToBinary(new Float32Array(0));
  assert.ok(empty instanceof Uint8Array);
  assert.equal(empty.length, 0);

  const nil = convertFloatMaskToBinary(null);
  assert.ok(nil instanceof Uint8Array);
  assert.equal(nil.length, 0);
});

test("3. processSegmentationMask extracts data and calls close() on mask", () => {
  let closed = false;
  const mockMask = {
    width: 640,
    height: 480,
    getAsFloat32Array: () => new Float32Array([0.2, 0.7, 0.9, 0.4]),
    close: () => {
      closed = true;
    },
  };

  const result = processSegmentationMask(mockMask);
  assert.equal(closed, true, "Mask close() must be invoked");
  assert.ok(result !== null);
  assert.equal(result.width, 640);
  assert.equal(result.height, 480);
  assert.ok(result.data instanceof Uint8Array);
  assert.deepEqual(Array.from(result.data), [0, 1, 1, 0]);
});
