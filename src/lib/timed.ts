// Runs an async call and measures it. Kept out of components because React
// render functions must not read the clock.
export async function timed<T>(run: () => Promise<T>) {
  const started = performance.now();
  const value = await run();
  return { value, ms: performance.now() - started };
}
