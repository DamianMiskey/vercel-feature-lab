// What Vercel tells a deployment about itself, through system environment
// variables. Every git push gets its own deployment and URL; these say which
// one is running.
export function deploymentInfo(env: Record<string, string | undefined> = process.env) {
  const sha = env.VERCEL_GIT_COMMIT_SHA;
  return {
    environment: env.VERCEL_ENV ?? "local", // production | preview | development
    branch: env.VERCEL_GIT_COMMIT_REF ?? null,
    commit: sha ? sha.slice(0, 7) : null,
    commitMessage: env.VERCEL_GIT_COMMIT_MESSAGE?.split("\n")[0].slice(0, 80) ?? null,
    deploymentUrl: env.VERCEL_URL ? `https://${env.VERCEL_URL}` : null,
    branchUrl: env.VERCEL_BRANCH_URL ? `https://${env.VERCEL_BRANCH_URL}` : null,
    productionUrl: env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : null,
    region: env.VERCEL_REGION ?? "local",
  };
}
