import { verifyHuman } from "@/lib/botid";

// A BotID-protected endpoint. Browsers on the lab's pages pass the invisible
// challenge (src/instrumentation-client.ts attaches its result to this
// request); scripts like curl don't, and get 403.
export async function POST() {
  const verdict = await verifyHuman();
  if (verdict.isBot) return Response.json({ ...verdict, message: "Bot detected: access denied." }, { status: 403 });
  return Response.json({ ...verdict, message: "Looks human: request allowed." });
}
