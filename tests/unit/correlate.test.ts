import { describe, it, expect } from "vitest";
import type { TemporalEvent } from "@tracelens/core";
import { findRelatedEventIds } from "@tracelens/live";

function makeEvent(id: string, type: TemporalEvent["type"], start: number, description = "event"): TemporalEvent {
  return {
    id,
    sessionId: "session_test",
    timestamp: { start, end: start },
    type,
    description,
    source: { kind: "browser", reference: "{}" },
    relatedEventIds: [],
  };
}

describe("findRelatedEventIds", () => {
  it("links a network event to a recent preceding interaction", () => {
    const click = makeEvent("e1", "interaction", 10);
    const request = makeEvent("e2", "network", 10.5, "POST /api/checkout");
    expect(findRelatedEventIds(request, [click])).toEqual(["e1"]);
  });

  it("does not link a network event to an interaction outside the window", () => {
    const click = makeEvent("e1", "interaction", 10);
    const request = makeEvent("e2", "network", 20, "POST /api/checkout"); // 10s later, default window is 3s
    expect(findRelatedEventIds(request, [click])).toEqual([]);
  });

  it("links a console error to a recent preceding network event", () => {
    const request = makeEvent("e1", "network", 10, "POST /api/checkout -> 500");
    const error = makeEvent("e2", "console", 11, "console.error: checkout failed");
    expect(findRelatedEventIds(error, [request])).toEqual(["e1"]);
  });

  it("does not link a non-error console message to a network event", () => {
    const request = makeEvent("e1", "network", 10, "GET /api/ping -> 200");
    const log = makeEvent("e2", "console", 10.5, "console.log: ready");
    expect(findRelatedEventIds(log, [request])).toEqual([]);
  });

  it("reconstructs the full plan example chain: click -> request -> console error", () => {
    const events: TemporalEvent[] = [];
    const click = makeEvent("e1", "interaction", 0, "Click on button#checkout");
    events.push(click);

    const request = makeEvent("e2", "network", 0.2, "POST /api/checkout");
    const requestRelated = findRelatedEventIds(request, events);
    request.relatedEventIds = requestRelated;
    events.push(request);

    const response = makeEvent("e3", "network", 0.6, "POST /api/checkout -> 500");
    const responseRelated = findRelatedEventIds(response, events);
    response.relatedEventIds = responseRelated;
    events.push(response);

    const error = makeEvent("e4", "console", 0.7, "console.error: checkout failed");
    const errorRelated = findRelatedEventIds(error, events);

    expect(requestRelated).toEqual(["e1"]);
    expect(responseRelated).toEqual(["e1"]); // still the click -- nearest preceding interaction
    expect(errorRelated).toEqual(["e3"]); // nearest preceding network event
  });

  it("ignores future events even if present in the recent-events list", () => {
    const future = makeEvent("e1", "interaction", 100);
    const request = makeEvent("e2", "network", 10);
    expect(findRelatedEventIds(request, [future])).toEqual([]);
  });

  it("returns an empty array for an ordinary event with no plausible cause", () => {
    const log = makeEvent("e1", "console", 5, "console.log: hello");
    expect(findRelatedEventIds(log, [])).toEqual([]);
  });
});
