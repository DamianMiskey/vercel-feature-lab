import { initBotId } from "botid/client/core";

// Runs in the browser before the app starts. BotID solves its invisible
// challenge and attaches the result to requests matching these routes; the
// server checks it with checkBotId(). Server Actions post to their page's URL.
initBotId({
  protect: [
    { path: "/api/security/botid", method: "POST", advancedOptions: { checkLevel: "basic" } },
    { path: "/postgres", method: "POST", advancedOptions: { checkLevel: "basic" } },
  ],
});
