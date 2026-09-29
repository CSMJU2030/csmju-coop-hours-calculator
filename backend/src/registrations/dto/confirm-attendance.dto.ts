import { IsArray, IsString } from 'class-validator';

export class ConfirmAttendanceDto {
  /** core_user_id (claim `sub`) ของนักศึกษาที่มาเข้าร่วมจริง (เทียบจากใบเซ็นชื่อ) */
  @IsArray()
  @IsString({ each: true })
  attendedCoreUserIds!: string[];
}
