"use client";

import { useState } from "react";

export default function CheckoutPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [confirmation, setConfirmation] = useState<string | null>(null);

  async function handleCheckout() {
    setStatus("loading");
    const res = await fetch("/api/checkout", { method: "POST" });
    const data = await res.json();
    // BUG: the API returns `{ id, total }`, not `{ orderId }` -- data.orderId
    // is undefined, so calling .toString() on it throws.
    setConfirmation(`Order ${data.orderId.toString()} confirmed!`);
    setStatus("done");
  }

  return (
    <main>
      <h1>Checkout</h1>
      <button id="checkout-btn" onClick={handleCheckout} disabled={status === "loading"}>
        {status === "loading" ? "Processing..." : "Place order"}
      </button>
      {confirmation && <p id="confirmation">{confirmation}</p>}
    </main>
  );
}
