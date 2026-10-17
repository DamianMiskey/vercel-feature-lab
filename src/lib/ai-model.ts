import { type LanguageModel, simulateReadableStream } from "ai";
import { MockLanguageModelV4 } from "ai/test";

// The model behind /ai. By default it's SIMULATED: the AI SDK's mock model,
// which streams a canned reply without calling any provider, so nothing can
// ever be billed. Set AI_MODEL to a gateway model id (for example
// "anthropic/claude-haiku-4.5") to use a real model through Vercel AI Gateway;
// the rest of the code doesn't change. (AI Gateway needs a card on file, even
// for its free tier.)

export const isSimulated = () => !process.env.AI_MODEL;

export function labModel(): LanguageModel {
  return process.env.AI_MODEL || simulatedModel();
}

type PromptMessage = { role: string; content: unknown };

// The text of the newest user message in a model prompt.
export function lastUserText(prompt: PromptMessage[]) {
  const last = [...prompt].reverse().find((m) => m.role === "user");
  if (!last || !Array.isArray(last.content)) return "";
  return last.content
    .map((part: { type?: string; text?: string }) => (part.type === "text" ? part.text ?? "" : ""))
    .join(" ")
    .trim();
}

export function simulatedAnswer(question: string) {
  const asked = question.length > 120 ? `${question.slice(0, 117)}…` : question;
  return [
    `This is a simulated reply: no AI model is connected, so nothing is billed.`,
    `You asked: "${asked}".`,
    `Here's what just happened. useChat sent your message to /api/ai/chat. The route checked the rate limit, converted the chat`,
    `into model messages and called streamText. The model, a mock from the AI SDK's test tools, emitted this text word by word,`,
    `and toUIMessageStream turned it into the stream your browser is reading now. With AI_MODEL set, the same route would`,
    `stream a real answer through Vercel AI Gateway instead.`,
  ].join(" ");
}

function simulatedModel() {
  return new MockLanguageModelV4({
    provider: "lab-simulated",
    modelId: "simulated",
    doStream: async ({ prompt }) => {
      const words = simulatedAnswer(lastUserText(prompt)).split(/(?<=\s)/);
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 300,
          chunkDelayInMs: 35,
          chunks: [
            { type: "text-start", id: "text-1" },
            ...words.map((delta) => ({ type: "text-delta" as const, id: "text-1", delta })),
            { type: "text-end", id: "text-1" },
            {
              type: "finish",
              finishReason: { unified: "stop", raw: undefined },
              logprobs: undefined,
              usage: {
                inputTokens: { total: 0, noCache: 0, cacheRead: undefined, cacheWrite: undefined },
                outputTokens: { total: words.length, text: words.length, reasoning: undefined },
              },
            },
          ],
        }),
      };
    },
  });
}
