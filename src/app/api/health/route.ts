// Route handler: app/api/health/route.ts answers GET /api/health.
export function GET() {
  return Response.json({ ok: true, time: new Date().toISOString() });
}
