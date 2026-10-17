import { flag } from "flags/next";
import { bucketOf, readLabConfig, rolloutPercent } from "@/lib/global-config";
import { VISITOR_COOKIE } from "@/lib/proxy-rules";

type Entities = { visitorId: string };

// Feature flags with the Flags SDK. The SDK doesn't care where a decision
// comes from: here the rollout percentage lives in Global Config, so raising
// it takes effect within seconds, with no redeploy.
export const newHeroFlag = flag<boolean, Entities>({
  key: "new-hero",
  description: "Gradual rollout of the new hero; percentage in Global Config at rollout.new-hero",
  defaultValue: false,
  // Who is asking: the visitor id that Proxy puts in a cookie.
  identify({ cookies }) {
    const visitorId = cookies.get(VISITOR_COOKIE)?.value;
    return visitorId ? { visitorId } : undefined;
  },
  // On for the first N% of buckets. A visitor's bucket never changes, so they
  // keep their answer as the percentage grows.
  async decide({ entities }) {
    if (!entities) return false;
    const read = await readLabConfig();
    if (!read.ok) return false;
    return bucketOf(entities.visitorId, "new-hero") < rolloutPercent(read.config, "new-hero");
  },
});
