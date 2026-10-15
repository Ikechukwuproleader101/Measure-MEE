import test from "node:test";
import assert from "node:assert/strict";
import { validateUploadFile, MAX_FILE_SIZE_BYTES } from "./uploadValidation.js";

test("1. Valid image types under 15 MB are accepted", () => {
  const jpg = validateUploadFile({ name: "front.jpg", type: "image/jpeg", size: 4 * 1024 * 1024 });
  assert.equal(jpg.valid, true);
  assert.equal(jpg.error, null);

  const png = validateUploadFile({ name: "side.png", type: "image/png", size: 10 * 1024 * 1024 });
  assert.equal(png.valid, true);
  assert.equal(png.error, null);

  const webp = validateUploadFile({ name: "side.webp", type: "image/webp", size: 2 * 1024 * 1024 });
  assert.equal(webp.valid, true);
  assert.equal(webp.error, null);
});

test("2. Wrong file types are rejected with exact brief copy", () => {
  const pdf = validateUploadFile({ name: "scan.pdf", type: "application/pdf", size: 1024 });
  assert.equal(pdf.valid, false);
  assert.equal(pdf.error, "Please choose a JPG or PNG photo.");

  const gif = validateUploadFile({ name: "animation.gif", type: "image/gif", size: 1024 });
  assert.equal(gif.valid, false);
  assert.equal(gif.error, "Please choose a JPG or PNG photo.");

  const svg = validateUploadFile({ name: "vector.svg", type: "image/svg+xml", size: 1024 });
  assert.equal(svg.valid, false);
  assert.equal(svg.error, "Please choose a JPG or PNG photo.");

  const nil = validateUploadFile(null);
  assert.equal(nil.valid, false);
});

test("3. Oversized files over 15 MB are rejected with exact brief copy", () => {
  const bigJpg = validateUploadFile({
    name: "huge.jpg",
    type: "image/jpeg",
    size: MAX_FILE_SIZE_BYTES + 1,
  });
  assert.equal(bigJpg.valid, false);
  assert.equal(bigJpg.error, "That photo is too large. Choose one under 15 MB.");

  const limitJpg = validateUploadFile({
    name: "limit.jpg",
    type: "image/jpeg",
    size: MAX_FILE_SIZE_BYTES,
  });
  assert.equal(limitJpg.valid, true);
});
