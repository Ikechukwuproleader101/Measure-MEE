import test from "node:test";
import assert from "node:assert/strict";
import { validateHeight } from "./heightValidation.js";

test("1. Boundary and valid heights are accepted (100, 175, 230)", () => {
  const h100 = validateHeight(100);
  assert.equal(h100.valid, true);
  assert.equal(h100.heightCm, 100);
  assert.equal(h100.error, null);

  const h175 = validateHeight("175");
  assert.equal(h175.valid, true);
  assert.equal(h175.heightCm, 175);
  assert.equal(h175.error, null);

  const h230 = validateHeight(230);
  assert.equal(h230.valid, true);
  assert.equal(h230.heightCm, 230);
  assert.equal(h230.error, null);
});

test("2. Out of range heights are rejected (99, 231)", () => {
  const h99 = validateHeight(99);
  assert.equal(h99.valid, false);
  assert.equal(h99.heightCm, null);
  assert.ok(h99.error.includes("between 100 and 230"));

  const h231 = validateHeight("231");
  assert.equal(h231.valid, false);
  assert.equal(h231.heightCm, null);
  assert.ok(h231.error.includes("between 100 and 230"));
});

test("3. Empty values and text strings are rejected", () => {
  const emptyStr = validateHeight("");
  assert.equal(emptyStr.valid, false);

  const spaces = validateHeight("   ");
  assert.equal(spaces.valid, false);

  const nil = validateHeight(null);
  assert.equal(nil.valid, false);

  const undef = validateHeight(undefined);
  assert.equal(undef.valid, false);

  const text = validateHeight("abc");
  assert.equal(text.valid, false);

  const mixed = validateHeight("170cm");
  assert.equal(mixed.valid, false);
});
