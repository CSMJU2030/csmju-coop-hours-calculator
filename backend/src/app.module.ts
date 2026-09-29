import { resolve } from 'path'; // <--- 1. เพิ่ม import นี้บรรทัดแรก
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ActivitiesModule } from './activities/activities.module';
import { AuthModule } from './auth/auth.module';
import { CoreHubJwtGuard } from './auth/guards/core-hub-jwt.guard';
import { PermissionsGuard } from './auth/guards/permissions.guard';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { DashboardModule } from './dashboard/dashboard.module';
import { HealthModule } from './health/health.module';
import { HourRequestsModule } from './hour-requests/hour-requests.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProfileModule } from './users/profile.module';
import { RegistrationsModule } from './registrations/registrations.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // 2. ระบุ path ให้ครอบคลุมทั้งกรณีรันจาก root และรันจากใน backend
      envFilePath: [
        resolve(process.cwd(), '.env'),
        resolve(process.cwd(), 'backend/.env'),
        resolve(__dirname, '../../.env'),
      ],
      load: [configuration],
      validate: validateEnv,
    }),
    PrismaModule,
    AuthModule,
    HealthModule,
    ProfileModule,
    ActivitiesModule,
    RegistrationsModule,
    HourRequestsModule,
    DashboardModule,
  ],
  providers: [
    // Every route is authenticated unless explicitly marked @Public().
    { provide: APP_GUARD, useClass: CoreHubJwtGuard },
    // Authorization runs after authentication.
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}