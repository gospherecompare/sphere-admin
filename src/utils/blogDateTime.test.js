import assert from "node:assert/strict";
import test from "node:test";
import {
  isBlogPublishedAtInFuture,
  parseBlogPublishedAt,
  toBlogDateTimeLocalValue,
} from "./blogDateTime.js";

test("published timestamps preserve the stored wall-clock time", () => {
  const publishedAt = "2026-10-16T20:30:00.000Z";

  assert.equal(toBlogDateTimeLocalValue(publishedAt), "2026-10-16T20:30");
  assert.equal(
    isBlogPublishedAtInFuture(
      publishedAt,
      new Date(2026, 9, 16, 22, 35),
    ),
    false,
  );
});

test("a future published timestamp remains scheduled", () => {
  assert.equal(
    isBlogPublishedAtInFuture(
      "2026-10-16T23:00:00.000Z",
      new Date(2026, 9, 16, 22, 35),
    ),
    true,
  );
});

test("published timestamps without a timezone preserve the wall clock", () => {
  assert.equal(
    toBlogDateTimeLocalValue("2026-10-16 20:30:00"),
    "2026-10-16T20:30",
  );
  assert.equal(parseBlogPublishedAt("not a date"), null);
});
