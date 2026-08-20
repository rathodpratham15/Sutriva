"use client";

import { useState } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setQuery(value);
    if (!value) {
      setResults([]);
      return;
    }
    // BUG: no request-id/AbortController guard against out-of-order
    // responses -- whichever response arrives *last* wins, even if it was
    // requested first and is now stale.
    const res = await fetch(`/api/search?q=${encodeURIComponent(value)}`);
    const data = await res.json();
    setResults(data.results);
  }

  return (
    <main>
      <h1>Search</h1>
      <input id="search-input" type="text" value={query} onChange={handleChange} placeholder="Type to search..." />
      <ul id="results">
        {results.map((r) => (
          <li key={r}>{r}</li>
        ))}
      </ul>
    </main>
  );
}
