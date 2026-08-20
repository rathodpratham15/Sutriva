import { NextResponse } from "next/server";

/**
 * Bug 2 fixture: deterministic, query-dependent latency so the race is
 * reproducible every time (not flaky like a real network would be) --
 * "cat" always takes longer to respond than "cats", so if a user types
 * "cat" then quickly "cats", the "cats" response can arrive first and then
 * get overwritten by the stale "cat" response. See demo/buggy-app/README.md.
 */
const DELAY_MS: Record<string, number> = {
  cat: 800,
  cats: 100,
};

function delayFor(query: string): number {
  return DELAY_MS[query] ?? 50;
}

const RESULTS: Record<string, string[]> = {
  cat: ["Cat food", "Cat tree", "Cat toy"],
  cats: ["Cats (the musical)", "Cats (2019 film)"],
};

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  await new Promise((resolve) => setTimeout(resolve, delayFor(query)));
  return NextResponse.json({ query, results: RESULTS[query] ?? [] });
}
