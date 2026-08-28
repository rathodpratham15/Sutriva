import type { Page } from "playwright";
import type { EventType } from "@sutriva/core";

/**
 * Browser instrumentation (TraceLens_Master_Plan.md §21). Captures the
 * high-value events the plan prioritizes -- navigation, click, input,
 * console, pageerror, request, response, requestfailed -- and normalizes
 * each into a small, type-tagged observation. Deliberately no DOM diffing:
 * "possible/likely/observed" reasoning happens downstream, not here.
 */
export interface BrowserObservation {
  type: EventType;
  description: string;
  /** Seconds elapsed since instrumentation attached (matches the replay timeline's "seconds" convention). */
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export type ObservationHandler = (observation: BrowserObservation) => void;

const MAX_TEXT_LENGTH = 200;
const MAX_URL_LENGTH = 300;

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/** Client-side script injected into the page to report real user clicks/input. Self-contained -- no closures. */
const CLIENT_SCRIPT = `
(() => {
  function describe(el) {
    if (!el || !el.tagName) return "unknown element";
    const tag = el.tagName.toLowerCase();
    const id = el.id ? "#" + el.id : "";
    const cls = el.className && typeof el.className === "string"
      ? "." + el.className.trim().split(/\\s+/).slice(0, 2).join(".")
      : "";
    const text = (el.innerText || el.value || "").trim().slice(0, 60);
    return tag + id + cls + (text ? ' ("' + text + '")' : "");
  }
  document.addEventListener("click", (e) => {
    try {
      window.__sutrivaReport("click", { selector: describe(e.target) });
    } catch (_) {}
  }, true);
  document.addEventListener("input", (e) => {
    try {
      const el = e.target;
      const isSensitive = el && (el.type === "password" || (el.autocomplete || "").includes("cc-"));
      const value = isSensitive ? "[redacted]" : (el && "value" in el ? String(el.value).slice(0, 80) : "");
      window.__sutrivaReport("input", { selector: describe(el), value });
    } catch (_) {}
  }, true);
})();
`;

/** Attaches listeners to `page` and reports observations via `onObservation`. Returns a detach function. */
export async function instrumentPage(page: Page, onObservation: ObservationHandler): Promise<() => void> {
  const startedAtMs = Date.now();
  const elapsed = () => (Date.now() - startedAtMs) / 1000;

  const onConsole = (msg: import("playwright").ConsoleMessage) => {
    onObservation({
      type: "console",
      description: `console.${msg.type()}: ${truncate(msg.text(), MAX_TEXT_LENGTH)}`,
      timestamp: elapsed(),
      metadata: { level: msg.type() },
    });
  };
  const onPageError = (err: Error) => {
    onObservation({
      type: "console",
      description: `Uncaught exception: ${truncate(err.message, MAX_TEXT_LENGTH)}`,
      timestamp: elapsed(),
      metadata: { stack: err.stack },
    });
  };
  const onRequest = (req: import("playwright").Request) => {
    onObservation({
      type: "network",
      description: `${req.method()} ${truncate(req.url(), MAX_URL_LENGTH)}`,
      timestamp: elapsed(),
      metadata: { method: req.method(), url: req.url() },
    });
  };
  const onResponse = (res: import("playwright").Response) => {
    onObservation({
      type: "network",
      description: `${res.request().method()} ${truncate(res.url(), MAX_URL_LENGTH)} -> ${res.status()}`,
      timestamp: elapsed(),
      metadata: { status: res.status(), url: res.url() },
    });
  };
  const onRequestFailed = (req: import("playwright").Request) => {
    onObservation({
      type: "network",
      description: `${req.method()} ${truncate(req.url(), MAX_URL_LENGTH)} failed: ${
        req.failure()?.errorText ?? "unknown error"
      }`,
      timestamp: elapsed(),
      metadata: { method: req.method(), url: req.url() },
    });
  };
  const onFrameNavigated = (frame: import("playwright").Frame) => {
    if (frame !== page.mainFrame()) return;
    onObservation({
      type: "dom",
      description: `Navigated to ${truncate(frame.url(), MAX_URL_LENGTH)}`,
      timestamp: elapsed(),
      metadata: { url: frame.url() },
    });
  };

  page.on("console", onConsole);
  page.on("pageerror", onPageError);
  page.on("request", onRequest);
  page.on("response", onResponse);
  page.on("requestfailed", onRequestFailed);
  page.on("framenavigated", onFrameNavigated);

  await page.exposeFunction(
    "__sutrivaReport",
    (kind: "click" | "input", detail: { selector: string; value?: string }) => {
      onObservation({
        type: "interaction",
        description:
          kind === "click" ? `Click on ${detail.selector}` : `Input into ${detail.selector}: "${detail.value ?? ""}"`,
        timestamp: elapsed(),
        metadata: detail,
      });
    },
  );
  await page.addInitScript(CLIENT_SCRIPT);

  return () => {
    page.off("console", onConsole);
    page.off("pageerror", onPageError);
    page.off("request", onRequest);
    page.off("response", onResponse);
    page.off("requestfailed", onRequestFailed);
    page.off("framenavigated", onFrameNavigated);
  };
}
