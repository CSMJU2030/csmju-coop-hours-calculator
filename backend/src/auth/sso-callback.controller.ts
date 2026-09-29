import { Controller, Get, HttpCode, Post, Query, Req, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AppException } from '../common/errors';
import { AuthEventsLogger } from './auth-events.logger';
import { TokenRejectionReason, TokenVerificationError } from './auth.errors';
import { CoreHubTokenVerifier } from './core-hub-token.verifier';
import { Public } from './decorators/public.decorator';
import { SsoCallbackQueryDto, SsoLoginQueryDto } from './dto/sso-callback.dto';
import { mapCoreRoleToSubsystemRole } from './role-mapping';
import {
  SSO_STATE_COOKIE_NAME,
  buildSsoCookie,
  buildStateCookie,
  clearSsoCookie,
  clearStateCookie,
  generateState,
  parseStateCookie,
  readCookie,
  safeNextPath,
  statesMatch,
} from './sso-session';

/**
 * Central SSO endpoints of this subsystem (auth-contract.md ข้อ 5).
 * ทั้งสามตัวอยู่นอก prefix `/api` และเป็น public:
 *
 *   GET  /auth/login?next=   สร้าง state → 302 ไป {CORE_HUB_WEB_URL}/sso/authorize
 *   GET  /auth/callback      ตรวจ state + token → ตั้งคุกกี้ session → 302 ไป next
 *   POST /auth/logout        ลบคุกกี้ของตัวเอง → 303 ไป {CORE_HUB_WEB_URL}/logout
 *
 * ไม่มีฟอร์ม ไม่มีรหัสผ่าน ไม่ออก token เอง — session คือ Core Hub token ที่ verify แล้ว
 * ห้าม log URL เต็มของ /auth/callback (มี token อยู่) — log ได้แค่ path
 */
@Controller('auth')
export class SsoCallbackController {
  constructor(
    private readonly verifier: CoreHubTokenVerifier,
    private readonly authEvents: AuthEventsLogger,
    private readonly config: ConfigService,
  ) {}

  private get secure(): boolean {
    return this.config.get<string>('nodeEnv') === 'production';
  }

  @Public()
  @Get('login')
  login(@Query() query: SsoLoginQueryDto, @Res() response: Response): void {
    const next = safeNextPath(query.next);
    const state = generateState();
    const subsystem = this.config.get<string>('subsystemId', 'csmju-coop-hours-calculator');
    const webUrl = this.config.get<string>('coreHub.webUrl', 'http://localhost:3100');

    const target = new URL(`${webUrl}/sso/authorize`);
    target.searchParams.set('subsystem', subsystem);
    target.searchParams.set('state', state);
    // ห้ามส่ง callback_url — Core Hub ใช้ค่าที่ลงทะเบียนไว้เท่านั้น

    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Set-Cookie', buildStateCookie(state, next, this.secure));
    response.redirect(302, target.toString());
  }

  @Public()
  @Get('callback')
  async callback(
    @Query() query: SsoCallbackQueryDto,
    @Req() request: Request,
    @Res() response: Response,
  ): Promise<void> {
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');

    const hasState = typeof query.state === 'string' && query.state.length > 0;

    // ตั้งคุกกี้ลบ state ไว้ก่อนตรวจ — ทุกคำตอบที่มี state เผาคุกกี้ state ทิ้งเสมอ
    const cookies: string[] = hasState ? [clearStateCookie(this.secure)] : [];
    const flush = () => {
      if (cookies.length > 0) {
        response.setHeader('Set-Cookie', cookies);
      }
    };

    if (!query.access_token) {
      flush();
      throw AppException.badRequest('access_token is required');
    }

    if (!hasState) {
      // เริ่มจาก sidebar ของ Core Hub: ทิ้ง token ไม่ตั้งคุกกี้ใด ๆ (ไม่แตะคุกกี้ state
      // เพราะแท็บอื่นอาจกำลังรอ callback ของตัวเอง) แล้วเริ่ม flow ใหม่ที่ /auth/login
      response.redirect(302, '/auth/login');
      return;
    }

    const stored = parseStateCookie(readCookie(request.header('cookie'), SSO_STATE_COOKIE_NAME));
    if (!stored || !statesMatch(stored.state, query.state as string)) {
      flush();
      // ห้าม redirect ซ้ำ — เบราว์เซอร์ที่ไม่เก็บคุกกี้จะวนไม่จบ
      throw AppException.unauthorized('SSO state does not match this browser');
    }

    let payload;
    try {
      payload = await this.verifier.verify(query.access_token);
    } catch (error) {
      const reason =
        error instanceof TokenVerificationError
          ? error.reason
          : TokenRejectionReason.MALFORMED_TOKEN;
      const kid = error instanceof TokenVerificationError ? error.kid : undefined;

      this.authEvents.jwtRejected({ reason, kid, path: '/auth/callback' });
      flush();
      throw AppException.unauthorized('The Core Hub SSO token could not be verified');
    }

    const subsystemRole = mapCoreRoleToSubsystemRole(payload.role);

    if (!subsystemRole) {
      this.authEvents.roleMappingFailed({ sub: payload.sub, coreRole: payload.role });
      flush();
      throw AppException.forbidden('Your Core Hub role has no access to this subsystem');
    }

    const expiresInSec =
      typeof payload.exp === 'number' ? Math.max(0, payload.exp - Math.floor(Date.now() / 1000)) : 0;

    cookies.push(buildSsoCookie(query.access_token, expiresInSec, this.secure));
    flush();

    this.authEvents.jwtVerified({
      sub: payload.sub,
      coreRole: payload.role,
      subsystemRole,
    });

    // ตรวจ next ซ้ำตอนใช้งาน เพราะค่ากลับมาจากคุกกี้
    response.redirect(302, safeNextPath(stored.next));
  }

  @Public()
  @Post('logout')
  @HttpCode(303)
  logout(@Res() response: Response): void {
    const webUrl = this.config.get<string>('coreHub.webUrl', 'http://localhost:3100');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Set-Cookie', [clearSsoCookie(this.secure), clearStateCookie(this.secure)]);
    response.redirect(303, `${webUrl}/logout`);
  }
}
