"use server";

import { updateTag } from "next/cache";
import { ON_DEMAND_TAG } from "@/lib/revalidate";

// A Server Action: a function the browser can call, running on the server.
// updateTag() expires the tagged cache entry immediately, so the page that
// re-renders after this action already shows fresh data.
// It only regenerates a timestamp, so it's safe to leave open to visitors.
export async function refreshNow() {
  updateTag(ON_DEMAND_TAG);
}
