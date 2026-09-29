import { SubsystemRole } from './core-hub-identity';

/**
 * Core Hub role -> csmju-coop-hours-calculator role.
 *
 *   Core Hub Role      Subsystem Role
 *   ---------------------------------
 *   student            STUDENT
 *   staff              STAFF    (อาจารย์/เจ้าหน้าที่ — ตรวจคำร้อง จัดกิจกรรม)
 *   admin              ADMIN
 *   alumni             (ไม่มีสิทธิ์ในระบบนี้ → 403)
 *
 * ต้องตรงกับ `default_role_mapping` ใน subsystem.yaml และในทะเบียน Core Hub เป๊ะ
 * (authorization.md ข้อ 3) — แก้ได้เฉพาะค่าในตารางนี้
 */
export const CORE_ROLE_TO_SUBSYSTEM_ROLE: Readonly<Record<string, SubsystemRole>> = Object.freeze({
  student: SubsystemRole.STUDENT,
  staff: SubsystemRole.STAFF,
  admin: SubsystemRole.ADMIN,
});

/**
 * Returns the subsystem role for a Core Hub role, or `null` when the Core Hub
 * role has no meaning in this subsystem (authenticated, but not authorized).
 */
export function mapCoreRoleToSubsystemRole(coreRole: string | undefined): SubsystemRole | null {
  if (typeof coreRole !== 'string') {
    return null;
  }
  return CORE_ROLE_TO_SUBSYSTEM_ROLE[coreRole.trim().toLowerCase()] ?? null;
}
