"use client";

import { useState } from "react";

// Client Component: rendered to HTML on the server first, then hydrated in the
// browser so the buttons work. Props from the server must be serializable.
export function Counter({ start }: { start: number }) {
  const [count, setCount] = useState(start);
  return (
    <div className="form-row">
      <button className="ghost" onClick={() => setCount((c) => c - 1)} aria-label="Decrease">−</button>
      <span className="big-number" aria-live="polite">{count}</span>
      <button className="ghost" onClick={() => setCount((c) => c + 1)} aria-label="Increase">+</button>
    </div>
  );
}
