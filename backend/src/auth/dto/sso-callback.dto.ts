import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

/**
 * Query parameters Core Hub appends to the registered callback URL.
 * Nothing here is trusted until the token itself is verified through JWKS.
 *
 * `access_token` เป็น optional ที่ระดับ DTO เพื่อให้ controller ตอบ 400 เอง
 * พร้อมเผาคุกกี้ state ตามข้อ 5.1 (ทุกคำตอบที่มี state ต้องลบคุกกี้ state)
 */
export class SsoCallbackQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(8192)
  access_token?: string;

  @IsOptional()
  @IsIn(['Bearer', 'bearer'])
  token_type?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  expires_in?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  state?: string;
}

export class SsoLoginQueryDto {
  @IsOptional()
  @IsString()
  next?: string;
}
