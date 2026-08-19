import { NextResponse } from "next/server";

/**
 * Bug 1 fixture: the API's real response shape (`id`, `total`) does not match
 * what app/checkout/page.tsx expects (`orderId`) -- an intentional schema
 * mismatch, not a network failure. See demo/buggy-app/README.md.
 */
export async function POST() {
  return NextResponse.json({ id: "ORD-1234", total: 49.99 });
}
