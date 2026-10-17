import { convertToModelMessages, createUIMessageStreamResponse, streamText, toUIMessageStream, validateUIMessages } from "ai";
import { labModel } from "@/lib/ai-model";
import { checkLimit, demoLimit, retryIn } from "@/lib/redis";

const MAX_MESSAGES = 20;
const MAX_INPUT_CHARS = 500;

// The chat endpoint useChat talks to. Even with the simulated model, it's
// built as if every call cost money: rate-limited, with capped input and output.
export async function POST(request: Request) {
  const limit = await checkLimit(demoLimit);
  if (limit && !limit.success) {
    return Response.json({ error: `Slow down: try again in ${retryIn(limit.reset)} s.` }, { status: 429 });
  }

  let messages;
  try {
    messages = await validateUIMessages({ messages: ((await request.json()) as { messages?: unknown }).messages });
  } catch {
    return Response.json({ error: "Invalid messages" }, { status: 400 });
  }
  const recent = messages.slice(-MAX_MESSAGES);
  const lastText = recent.at(-1)?.parts.map((p) => (p.type === "text" ? p.text : "")).join("") ?? "";
  if (lastText.length > MAX_INPUT_CHARS) {
    return Response.json({ error: `Messages are limited to ${MAX_INPUT_CHARS} characters.` }, { status: 413 });
  }

  const result = streamText({
    model: labModel(),
    system: "You are the Vercel Feature Lab's assistant. Answer briefly and plainly.",
    messages: await convertToModelMessages(recent),
    maxOutputTokens: 300,
  });

  return createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) });
}
