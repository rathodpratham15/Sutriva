import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>TraceLens demo -- buggy-app</h1>
      <p>
        A small, deterministic app with three intentional bugs, used to demo/benchmark TraceLens
        (see <code>demo/buggy-app/README.md</code> and <code>docs/evaluation.md</code> for
        reproduction steps and expected root causes).
      </p>
      <div className="card">
        <h2>Bug 1 -- API response mismatch</h2>
        <p>The checkout API returns a different shape than the frontend expects.</p>
        <Link href="/checkout">Go to /checkout</Link>
      </div>
      <div className="card">
        <h2>Bug 2 -- async race condition</h2>
        <p>A search box that can show stale results when responses arrive out of order.</p>
        <Link href="/search">Go to /search</Link>
      </div>
      <div className="card">
        <h2>Bug 3 -- responsive visual regression</h2>
        <p>A layout that breaks at narrow viewport widths.</p>
        <Link href="/responsive">Go to /responsive</Link>
      </div>
    </main>
  );
}
