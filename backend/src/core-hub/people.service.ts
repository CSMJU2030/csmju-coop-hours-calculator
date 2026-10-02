import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CoreHubCallError, coreHubFailure, getFromCoreHub } from './core-hub-http';

/**
 * ข้อมูลบุคคลจาก Core Hub (reference-data.md ข้อ 5) — ไม่ใช่ข้อมูลอ้างอิง
 *
 * - **ห้าม cache ทุกแบบ**: เรียกตอนใช้ ด้วย token ของผู้ใช้ที่กำลังเรียกทุกครั้ง
 * - ฐานข้อมูลของระบบนี้เก็บได้แค่ `person_code` (ข้อ 8) — ชื่อ อีเมล และ field อื่นของบุคคล
 *   ใช้แสดงผลเท่านั้น ห้ามเขียนลงฐาน ห้าม log
 */

/** ส่วนของบุคคลที่ระบบนี้ใช้แสดงผล */
export interface PersonSummary {
  personCode: string;
  fullNameTh: string;
  /** ปี พ.ศ. ที่เข้าศึกษา */
  entryYear: number | null;
  /** ชื่อภาควิชา/สาขา */
  departmentNameTh: string | null;
}

/** หน้าละไม่เกิน 100 (api-conventions) และกันวนไม่จบถ้า Core Hub ตอบผิดปกติ */
const PAGE_LIMIT = 100;
const MAX_PAGES = 20;

@Injectable()
export class PeopleService {
  private readonly logger = new Logger(PeopleService.name);

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    return this.config.get<string>('coreHub.url', 'http://localhost:3000').replace(/\/+$/, '');
  }

  private get requestTimeoutMs(): number {
    return this.config.get<number>('coreHub.dataRequestTimeoutMs', 5_000);
  }

  /**
   * บุคคลที่ผูกกับบัญชีของผู้เรียก — `GET /people/me`
   *
   * - บัญชียังไม่ผูกกับบุคคล (`data: null` เช่น บัญชีทดสอบ) → null
   * - role ที่อ่านไม่ได้ (`guest` ได้ 403) → null
   * - Core Hub ตอบ 401 → 401 UNAUTHORIZED ให้ frontend พา SSO ใหม่ (ไม่ใช่ 503)
   * - 429 · ล่ม · timeout · คำตอบผิดรูปแบบ → 503 + Retry-After
   */
  async me(token: string): Promise<PersonSummary | null> {
    let body: unknown;
    try {
      body = await getFromCoreHub(`${this.baseUrl}/api/v1/people/me`, token, this.requestTimeoutMs);
    } catch (error) {
      if (error instanceof CoreHubCallError && error.status === 403) {
        return null;
      }
      throw coreHubFailure(error);
    }

    const { success, data } = (body ?? {}) as { success?: unknown; data?: unknown };
    if (success === true && data === null) {
      return null;
    }
    const person = toPerson(data);
    if (success !== true || !person) {
      throw coreHubFailure(new Error('GET /people/me answered without a personCode'));
    }
    return person;
  }

  /**
   * รายชื่อนักศึกษาทุกสถานะ จัดเป็น Map ตาม personCode — ไว้แปลง `person_code` เป็นชื่อตอนแสดงผล
   * ให้ผู้ที่มีสิทธิ์ `people:read` (staff · lecturer · admin)
   *
   * ใช้กับหน้ารายการ ซึ่งต้องไม่พังเมื่อหาชื่อไม่ได้ (reference-data.md ข้อ 8): ถ้า Core Hub ตอบ 403
   * ล่ม หรือตอบผิดรูปแบบ จะคืน Map ว่าง (หน้าจอแสดงแค่ `person_code`) ยกเว้น 401 ที่ต้องส่งต่อ
   * ให้ frontend พา SSO ใหม่ ไม่มี cache — เรียกใหม่ทุกคำขอ
   */
  async studentDirectory(token: string): Promise<Map<string, PersonSummary>> {
    const directory = new Map<string, PersonSummary>();

    try {
      for (let page = 1; page <= MAX_PAGES; page += 1) {
        const url =
          `${this.baseUrl}/api/v1/people?personType=STUDENT&status=ALL&page=${page}&limit=${PAGE_LIMIT}`;
        const body = await getFromCoreHub(url, token, this.requestTimeoutMs);

        const { success, data, meta } = (body ?? {}) as {
          success?: unknown;
          data?: unknown;
          meta?: { totalPages?: unknown };
        };
        if (success !== true || !Array.isArray(data)) {
          throw new Error('GET /people answered with an unexpected body');
        }

        for (const item of data) {
          const person = toPerson(item);
          if (person) {
            directory.set(person.personCode, person);
          }
        }

        const totalPages = typeof meta?.totalPages === 'number' ? meta.totalPages : undefined;
        const last = totalPages !== undefined ? page >= totalPages : data.length < PAGE_LIMIT;
        if (last) {
          break;
        }
      }
    } catch (error) {
      if (error instanceof CoreHubCallError && error.status === 401) {
        throw coreHubFailure(error);
      }
      // ไม่ log ข้อความจาก Core Hub (อาจมีข้อมูลบุคคล) — log แค่ชนิดของความผิดพลาด
      this.logger.warn(
        JSON.stringify({
          event: 'core_hub.people_directory_unavailable',
          status: error instanceof CoreHubCallError ? error.status : 0,
        }),
      );
      return new Map();
    }

    return directory;
  }
}

function toPerson(value: unknown): PersonSummary | null {
  const raw = value as Record<string, unknown> | null | undefined;
  if (!raw || typeof raw.personCode !== 'string' || raw.personCode.length === 0) {
    return null;
  }
  const department = raw.department as { nameTh?: unknown } | null | undefined;
  return {
    personCode: raw.personCode,
    fullNameTh: typeof raw.fullNameTh === 'string' ? raw.fullNameTh : '',
    entryYear: typeof raw.entryYear === 'number' ? raw.entryYear : null,
    departmentNameTh: typeof department?.nameTh === 'string' ? department.nameTh : null,
  };
}
