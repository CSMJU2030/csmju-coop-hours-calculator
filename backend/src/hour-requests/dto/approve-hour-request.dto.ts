import { Type } from 'class-transformer';
import { IsIn, IsNumber, IsOptional, Max, Min } from 'class-validator';

/**
 * ผลการอนุมัติ — ไม่ส่งมาเลยก็ได้ (ใช้ค่าที่นักศึกษาขอ) หรือให้อาจารย์ปรับชั่วโมง/หมวดที่อนุมัติจริง
 * ใช้ซ้ำได้ตอนแก้ผลตรวจของคำร้องที่อนุมัติไปแล้ว
 */
export class ApproveHourRequestDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.5)
  @Max(1000)
  approvedHours?: number;

  @IsOptional()
  @IsIn(['COOP', 'VOLUNTEER', 'MAJOR'])
  approvedCategory?: 'COOP' | 'VOLUNTEER' | 'MAJOR';
}
