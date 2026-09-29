/**
 * All environment-specific values live here. Nothing in the application code
 * may hard-code a URL, issuer, audience or secret (spec §30, §41.15).
 */
export interface AppConfig {
  nodeEnv: string;
  port: number;
  subsystemId: string;
  subsystemName: string;
  coreHub: {
    url: string;
    /** เว็บของ Core Hub ที่ GET /auth/login ส่งเบราว์เซอร์ไป (auth-contract.md ข้อ 5.2) */
    webUrl: string;
    jwksUrl: string;
    issuer: string;
    audience: string;
    jwksCacheTtlMs: number;
    jwksMinRefreshIntervalMs: number;
    jwksRequestTimeoutMs: number;
    clockToleranceSec: number;
  };
}

function num(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export default (): AppConfig => {
  const coreHubUrl = process.env.CORE_HUB_URL ?? 'http://localhost:3000';

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: num(process.env.PORT, 3012),
    subsystemId: process.env.SUBSYSTEM_ID ?? 'csmju-coop-hours-calculator',
    subsystemName: process.env.SUBSYSTEM_NAME ?? 'ระบบติดตามชั่วโมงสหกิจและกิจกรรม',
    coreHub: {
      url: coreHubUrl,
      webUrl: (process.env.CORE_HUB_WEB_URL ?? 'http://localhost:3100').replace(/\/+$/, ''),
      jwksUrl:
        process.env.CORE_HUB_JWKS_URL ??
        `${coreHubUrl.replace(/\/+$/, '')}/api/v1/.well-known/jwks.json`,
      issuer: process.env.CORE_HUB_ISSUER ?? 'core-hub',
      audience: process.env.CORE_HUB_AUDIENCE ?? 'csmju2030',
      jwksCacheTtlMs: num(process.env.JWKS_CACHE_TTL_MS, 10 * 60 * 1000),
      jwksMinRefreshIntervalMs: num(process.env.JWKS_MIN_REFRESH_INTERVAL_MS, 30 * 1000),
      jwksRequestTimeoutMs: num(process.env.JWKS_REQUEST_TIMEOUT_MS, 5000),
      clockToleranceSec: num(process.env.JWT_CLOCK_TOLERANCE_SEC, 5),
    },
  };
};
