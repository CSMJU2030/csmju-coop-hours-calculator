import { SubsystemRole } from './core-hub-identity';
import { CORE_ROLE_TO_SUBSYSTEM_ROLE, mapCoreRoleToSubsystemRole } from './role-mapping';

describe('Core role -> subsystem role mapping (authorization.md ข้อ 3)', () => {
  it.each([
    ['student', SubsystemRole.STUDENT],
    ['staff', SubsystemRole.STAFF],
    ['admin', SubsystemRole.ADMIN],
  ])('maps core role "%s" to %s', (coreRole, expected) => {
    expect(mapCoreRoleToSubsystemRole(coreRole)).toBe(expected);
  });

  it('does not grant alumni any access to this subsystem', () => {
    expect(mapCoreRoleToSubsystemRole('alumni')).toBeNull();
  });

  it('is case and whitespace tolerant', () => {
    expect(mapCoreRoleToSubsystemRole('  STAFF ')).toBe(SubsystemRole.STAFF);
  });

  it('returns null for an unknown role or a missing role claim', () => {
    expect(mapCoreRoleToSubsystemRole('finance-officer')).toBeNull();
    expect(mapCoreRoleToSubsystemRole(undefined)).toBeNull();
  });

  it('matches default_role_mapping declared in subsystem.yaml', () => {
    expect(CORE_ROLE_TO_SUBSYSTEM_ROLE).toEqual({ student: 'STUDENT', staff: 'STAFF', admin: 'ADMIN' });
  });
});
