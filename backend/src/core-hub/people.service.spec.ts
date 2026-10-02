import { ConfigService } from '@nestjs/config';
import { PeopleService } from './people.service';
import { yearLevelFromEntryYear } from '../users/profile.service';

/** Core Hub ปลอม: แทน fetch ทั้งตัว ไม่ยิงเครือข่ายจริง */
function mockFetch(handler: (url: string) => { status: number; body?: unknown }): jest.SpyInstance {
  return jest.spyOn(globalThis, 'fetch').mockImplementation(async (input) => {
    const { status, body } = handler(String(input));
    return new Response(body === undefined ? null : JSON.stringify(body), {
      status,
      headers: { 'content-type': 'application/json' },
    });
  });
}

const config = { get: (_key: string, fallback?: unknown) => fallback } as unknown as ConfigService;

const person = (code: string, overrides: Record<string, unknown> = {}) => ({
  personCode: code,
  personType: 'STUDENT',
  fullNameTh: `ชื่อทดสอบ ${code}`,
  entryYear: 2567,
  department: { code: 'CS', nameTh: 'วิทยาการคอมพิวเตอร์' },
  ...overrides,
});

describe('PeopleService', () => {
  let service: PeopleService;

  beforeEach(() => {
    service = new PeopleService(config);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('me()', () => {
    it('คืนรหัสและชื่อของบุคคลที่ผูกกับบัญชี และส่ง token ของผู้เรียกไป', async () => {
      const spy = mockFetch(() => ({ status: 200, body: { success: true, data: person('T001') } }));

      const result = await service.me('user-token');

      expect(result).toEqual({
        personCode: 'T001',
        fullNameTh: 'ชื่อทดสอบ T001',
        entryYear: 2567,
        departmentNameTh: 'วิทยาการคอมพิวเตอร์',
      });
      const [url, init] = spy.mock.calls[0] as [string, RequestInit];
      expect(url).toBe('http://localhost:3000/api/v1/people/me');
      expect((init.headers as Record<string, string>).authorization).toBe('Bearer user-token');
    });

    it('คืน null เมื่อบัญชียังไม่ผูกกับบุคคล (data: null)', async () => {
      mockFetch(() => ({ status: 200, body: { success: true, data: null } }));
      await expect(service.me('t')).resolves.toBeNull();
    });

    it('คืน null เมื่อ role อ่านไม่ได้ (403)', async () => {
      mockFetch(() => ({ status: 403, body: { success: false } }));
      await expect(service.me('t')).resolves.toBeNull();
    });

    it('401 จาก Core Hub ต้องเป็น 401 ให้ frontend พา SSO ใหม่ ไม่ใช่ 503', async () => {
      mockFetch(() => ({ status: 401, body: { success: false } }));
      await expect(service.me('t')).rejects.toMatchObject({ status: 401 });
    });

    it('Core Hub ล่ม (500) ต้องเป็น 503', async () => {
      mockFetch(() => ({ status: 500, body: { success: false } }));
      await expect(service.me('t')).rejects.toMatchObject({ status: 503 });
    });
  });

  describe('studentDirectory()', () => {
    it('อ่านทุกหน้าแล้วรวมเป็น Map ตามรหัส', async () => {
      const spy = mockFetch((url) => {
        const page = Number(new URL(url).searchParams.get('page'));
        return {
          status: 200,
          body: {
            success: true,
            data: page === 1 ? [person('A1'), person('A2')] : [person('A3')],
            meta: { total: 3, page, limit: 100, totalPages: 2 },
          },
        };
      });

      const directory = await service.studentDirectory('staff-token');

      expect([...directory.keys()]).toEqual(['A1', 'A2', 'A3']);
      expect(spy).toHaveBeenCalledTimes(2);
      expect(String(spy.mock.calls[0][0])).toContain('personType=STUDENT');
      expect(String(spy.mock.calls[0][0])).toContain('limit=100');
    });

    it('ไม่มีสิทธิ์ (403) หรือ Core Hub ล่ม ต้องคืน Map ว่างโดยไม่ล้ม เพื่อให้หน้ารายการแสดงแค่รหัส', async () => {
      mockFetch(() => ({ status: 403, body: { success: false } }));
      await expect(service.studentDirectory('t')).resolves.toEqual(new Map());

      mockFetch(() => ({ status: 503, body: { success: false } }));
      await expect(service.studentDirectory('t')).resolves.toEqual(new Map());
    });

    it('คำตอบผิดรูปแบบก็คืน Map ว่าง', async () => {
      mockFetch(() => ({ status: 200, body: { success: true, data: 'not an array' } }));
      await expect(service.studentDirectory('t')).resolves.toEqual(new Map());
    });

    it('401 ต้องส่งต่อ เพื่อให้ frontend พา SSO ใหม่', async () => {
      mockFetch(() => ({ status: 401, body: { success: false } }));
      await expect(service.studentDirectory('t')).rejects.toMatchObject({ status: 401 });
    });

    it('ข้ามรายการที่ไม่มี personCode และไม่วนเกินจำนวนหน้าสูงสุดเมื่อ Core Hub ตอบไม่จบ', async () => {
      const spy = mockFetch(() => ({
        status: 200,
        body: { success: true, data: Array.from({ length: 100 }, (_, i) => person(`P${i}`)).concat([{} as never]) },
      }));

      await service.studentDirectory('t');

      expect(spy.mock.calls.length).toBeLessThanOrEqual(20);
    });
  });
});

describe('yearLevelFromEntryYear()', () => {
  it('คำนวณชั้นปีจากปีที่เข้า (ปีการศึกษาใหม่เริ่มเดือนมิถุนายน)', () => {
    // ต.ค. 2569 → ปีการศึกษา 2569 · เข้าปี 2567 = ปี 3
    expect(yearLevelFromEntryYear(2567, new Date('2026-10-03'))).toBe(3);
    // พ.ค. 2569 ยังเป็นปีการศึกษา 2568 → ปี 2
    expect(yearLevelFromEntryYear(2567, new Date('2026-05-15'))).toBe(2);
    // มิ.ย. 2569 เริ่มปีการศึกษาใหม่ → ปี 3
    expect(yearLevelFromEntryYear(2567, new Date('2026-06-15'))).toBe(3);
  });

  it('ไม่รู้ปีที่เข้า หรือปีที่เข้าอยู่ในอนาคต = null', () => {
    expect(yearLevelFromEntryYear(null)).toBeNull();
    expect(yearLevelFromEntryYear(2600, new Date('2026-10-03'))).toBeNull();
  });
});
