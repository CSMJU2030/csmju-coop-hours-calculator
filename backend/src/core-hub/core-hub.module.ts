import { Module } from '@nestjs/common';
import { PeopleService } from './people.service';

/**
 * ข้อมูลกลางจาก Core Hub — import module นี้ใน module ที่ต้องใช้ แล้ว inject PeopleService
 * (ข้อมูลบุคคล ห้าม cache) · ต้องมี ConfigModule แบบ global อยู่แล้ว
 */
@Module({
  providers: [PeopleService],
  exports: [PeopleService],
})
export class CoreHubModule {}
