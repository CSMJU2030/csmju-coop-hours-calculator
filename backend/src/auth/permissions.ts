import { SubsystemRole } from './core-hub-identity';

/**
 * Permissions of csmju-coop-hours-calculator (authorization.md ข้อ 4).
 *
 *   Core JWT -> Core Role -> Subsystem Role -> Permission -> Business Operation
 *
 * `:own` = เฉพาะข้อมูลของตัวเอง (record.core_user_id === token.sub) — guard
 * ปล่อยผ่าน แล้ว service ตรวจ ownership กับข้อมูลจริงอีกชั้นเสมอ
 */
export enum Permission {
  PROFILE_READ_OWN = 'profile:read:own',

  ACTIVITY_READ = 'activity:read',
  ACTIVITY_CREATE = 'activity:create',
  ACTIVITY_UPDATE = 'activity:update',
  ACTIVITY_DELETE = 'activity:delete',

  PARTICIPATION_READ_OWN = 'participation:read:own',
  PARTICIPATION_READ_ANY = 'participation:read:any',
  PARTICIPATION_CREATE_OWN = 'participation:create:own',
  PARTICIPATION_DELETE_OWN = 'participation:delete:own',

  HOUR_REQUEST_READ_OWN = 'hour-request:read:own',
  HOUR_REQUEST_READ_ANY = 'hour-request:read:any',
  HOUR_REQUEST_CREATE_OWN = 'hour-request:create:own',
  HOUR_REQUEST_UPDATE_OWN = 'hour-request:update:own',
  HOUR_REQUEST_DELETE_OWN = 'hour-request:delete:own',
  HOUR_REQUEST_REVIEW_ANY = 'hour-request:review:any',

  ATTENDANCE_READ_ANY = 'attendance:read:any',
  ATTENDANCE_UPDATE_ANY = 'attendance:update:any',

  HOUR_SUMMARY_READ_ANY = 'hour-summary:read:any',
}

const STUDENT_PERMISSIONS: Permission[] = [
  Permission.PROFILE_READ_OWN,
  Permission.ACTIVITY_READ,
  Permission.PARTICIPATION_READ_OWN,
  Permission.PARTICIPATION_CREATE_OWN,
  Permission.PARTICIPATION_DELETE_OWN,
  Permission.HOUR_REQUEST_READ_OWN,
  Permission.HOUR_REQUEST_CREATE_OWN,
  Permission.HOUR_REQUEST_UPDATE_OWN,
  Permission.HOUR_REQUEST_DELETE_OWN,
];

/** อาจารย์/เจ้าหน้าที่ — เดิมระบบให้ staff = admin ของระบบย่อย จึงคงสิทธิ์เท่ากัน */
const STAFF_PERMISSIONS: Permission[] = Object.values(Permission);

const ADMIN_PERMISSIONS: Permission[] = Object.values(Permission);

export const ROLE_PERMISSIONS: Readonly<Record<SubsystemRole, readonly Permission[]>> =
  Object.freeze({
    [SubsystemRole.STUDENT]: Object.freeze(STUDENT_PERMISSIONS),
    // alumni ไม่ถูกแมปใน role-mapping.ts จึงไม่มีทางมาถึงจุดนี้ — ให้สิทธิ์ว่างไว้กันพลาด
    [SubsystemRole.ALUMNI]: Object.freeze([] as Permission[]),
    [SubsystemRole.STAFF]: Object.freeze(STAFF_PERMISSIONS),
    [SubsystemRole.ADMIN]: Object.freeze(ADMIN_PERMISSIONS),
  });

/** Does this subsystem role hold the given permission? */
export function can(role: SubsystemRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false;
}

/** Does this subsystem role hold at least one of the given permissions? */
export function canAny(role: SubsystemRole, permissions: readonly Permission[]): boolean {
  return permissions.some((permission) => can(role, permission));
}

/** ถือสิทธิ์ `:any` ของ resource นี้หรือไม่ (ใช้ใน service ตัดสินว่าต้องตรวจ ownership ไหม) */
export function canAccessAny(role: SubsystemRole, anyPermission: Permission): boolean {
  return can(role, anyPermission);
}
