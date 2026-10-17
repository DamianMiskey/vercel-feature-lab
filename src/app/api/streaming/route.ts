import { connection } from "next/server";
import { delay } from "@/lib/delay";

// Streams five lines, one every 400 ms. Vercel Functions stream responses by
// default, so each chunk reaches the browser as soon as it's enqueued.
export async function GET() {
  await connection();
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      for (let i = 1; i <= 5; i++) {
        await delay(400);
        controller.enqueue(encoder.encode(`chunk ${i}/5 at ${new Date().toISOString().slice(11, 23)}\n`));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}
