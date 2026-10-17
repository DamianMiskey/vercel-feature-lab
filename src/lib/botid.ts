import { checkBotId } from "botid/server";

// BotID at the Basic level only: free on every plan. (Deep Analysis is a
// paid, Pro-only extra; the lab never asks for it.)
export const BOTID_LEVEL = "basic" as const;

export async function verifyHuman() {
  const result = await checkBotId({
    advancedOptions: { checkLevel: BOTID_LEVEL },
    // BotID only works on Vercel. Anywhere else (next dev, or next start on
    // your machine, which runs in production mode) it would throw, so treat
    // those as development: every request counts as human.
    developmentOptions: { isDevelopment: !process.env.VERCEL },
  });
  return { isBot: result.isBot, isHuman: result.isHuman, isVerifiedBot: result.isVerifiedBot, bypassed: result.bypassed };
}
