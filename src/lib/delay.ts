// Simulates a slow data source so streaming and caching are visible.
export const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
