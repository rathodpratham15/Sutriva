import { describe, it, expect } from "vitest";
import { keywordOverlapRatio } from "../eval/agentic-harness.js";

describe("keywordOverlapRatio", () => {
  it("scores 1 when every significant word from expected appears in actual", () => {
    const expected = "Frontend reads data.orderId but the API returns { id, total } -- a response schema mismatch causes a TypeError.";
    const actual =
      "Confirmed -- the frontend reads data.orderId, a field the API never returns (it returns id and total). " +
      "data.orderId is undefined, so .toString() throws a TypeError -- a response schema mismatch.";
    expect(keywordOverlapRatio(expected, actual)).toBeGreaterThanOrEqual(0.7);
  });

  it("scores low when actual text is about something else entirely", () => {
    const expected = "The mobile media query grows the header's height without a matching increase to the content's padding-top.";
    const actual = "I ran the test suite and everything passes. No further changes needed.";
    expect(keywordOverlapRatio(expected, actual)).toBeLessThan(0.3);
  });

  it("ignores stopwords and punctuation, not just exact substring matches", () => {
    const expected = "No request-sequencing guard: a slower 'cat' response overwrites the newer, faster 'cats' response.";
    const actual = "There's no guard against out-of-order responses -- the slower cat request overwrites the faster cats one.";
    expect(keywordOverlapRatio(expected, actual)).toBeGreaterThan(0.5);
  });

  it("is not fooled by grading against a truncated preamble instead of the full response", () => {
    // Regression test for a real bug found while live-testing the agentic
    // harness: an earlier version graded only the first 500 characters of
    // Claude's response, which was sometimes unrelated narration before the
    // actual report -- this asserts the function itself has no such bias
    // (the harness now always passes the full text in).
    const expected = "Frontend reads data.orderId but the API returns { id, total }.";
    const preambleThenAnswer =
      "Typecheck passes clean for the fixed file. There's no reproduction video available for the post-fix state. ".repeat(10) +
      "Root cause: the frontend reads data.orderId but the API returns { id, total }.";
    expect(keywordOverlapRatio(expected, preambleThenAnswer)).toBeGreaterThanOrEqual(0.7);
  });

  it("returns 1 for an empty expected root cause (nothing to fail to match)", () => {
    expect(keywordOverlapRatio("", "anything at all")).toBe(1);
  });
});
