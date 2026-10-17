import { cacheLife } from "next/cache";
import { readFile } from "node:fs/promises";
import path from "node:path";

// Read a source file once and cache the result (Cache Components). It runs at
// build time, so the code is baked into the prerendered HTML and the function
// bundle doesn't need the source files.
// Paths are relative to src/ so the file access is statically scoped: only
// src/ gets traced into the deployment, not the whole project.
// Source can't change within a deployment, so it's cached for the longest
// life ("max"); a shorter one would cap the life of every page that uses it.
async function readSource(file: string) {
  "use cache";
  cacheLife("max");
  return readFile(path.join(process.cwd(), "src", file), "utf8");
}

// Shows the source file behind a demo. Unlike the Cloudflare lab (Vite `?raw`
// imports), a Server Component can simply read the file.
export async function CodePeek({ file }: { file: string }) {
  const source = await readSource(file);
  return (
    <details className="codepeek">
      <summary className="ghost-button">Show code · <code>src/{file}</code></summary>
      <pre className="code">{source}</pre>
    </details>
  );
}
