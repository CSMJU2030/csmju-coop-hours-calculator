import { NextResponse } from 'next/server';

const startedAt = Date.now();

// api-conventions.md: every response wrapped in { success, data }.
// `service` must match `name` in subsystem.yaml — Core Hub and the
// integration tests (LOCAL_INTEGRATION_GUIDE.md T3) compare against it.
export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      status: 'ok',
      service: 'csmju-coop-hours-calculator',
      uptime: Math.floor((Date.now() - startedAt) / 1000),
      timestamp: new Date().toISOString(),
    },
  });
}
