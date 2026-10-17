import { connection } from "next/server";
import { Suspense } from "react";
import { CodePeek } from "@/components/CodePeek";
import { Demo, FeaturePage } from "@/components/FeaturePage";
import { isSimulated } from "@/lib/ai-model";
import { Chat } from "./Chat";

async function ModelBadge() {
  await connection();
  return isSimulated()
    ? <p className="error" role="note">Simulated: no AI provider is connected. Replies come from the AI SDK&apos;s mock model, so nothing is billed.</p>
    : <p className="small muted">Connected to <code>{process.env.AI_MODEL}</code> through Vercel AI Gateway.</p>;
}

export default function AiPage() {
  return (
    <FeaturePage
      title="AI SDK + AI Gateway"
      tagline="Stream AI responses into your UI with one SDK, whichever model you choose."
      docs="https://ai-sdk.dev/docs"
      whatItIs={<p>
        The <strong>AI SDK</strong> (<code>ai</code>) gives one API for every model: <code>streamText()</code> on the server and the{" "}
        <code>useChat()</code> hook in the browser, connected by a streamed response. <strong>Vercel AI Gateway</strong> sits in
        front of the providers: you name a model as a string such as <code>anthropic/claude-haiku-4.5</code>, and it handles keys,
        billing, fallbacks and spend limits. Swapping models is a one-line change.
      </p>}
      whenToUse={[
        "Chat and assistants",
        "Summaries, extraction and classification",
        "Any feature that should stream text as it's generated",
      ]}
    >
      <Demo title="Chat (useChat → streamText)">
        <Suspense fallback={null}>
          <ModelBadge />
        </Suspense>
        <Chat />
        <p className="small muted">
          Built as if every call cost money: 5 messages per 30 seconds per visitor, 500 characters in, 300 tokens out.
        </p>
      </Demo>

      <CodePeek file="app/api/ai/chat/route.ts" />
      <CodePeek file="app/ai/Chat.tsx" />
      <CodePeek file="lib/ai-model.ts" />
    </FeaturePage>
  );
}
