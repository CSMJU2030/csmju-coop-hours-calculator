import { NextResponse } from 'next/server';
import { ApiError, UnauthenticatedError } from '@/lib/api';

/** แปลง error จาก backend เป็น response ให้หน้าเว็บ โดยคงรูปแบบเดิม { success, error } */
export function toErrorResponse(error: unknown, context: string) {
  if (error instanceof UnauthenticatedError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 });
  }
  if (error instanceof ApiError) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.status });
  }
  console.error(`${context}:`, error);
  return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
}
