import { SubsystemRole } from './core-hub-identity';
import { Permission, ROLE_PERMISSIONS, can, canAny } from './permissions';

describe('csmju-coop-hours-calculator permission model', () => {
  describe('STUDENT', () => {
    const role = SubsystemRole.STUDENT;

    it('can view activities, register itself and manage its own hour requests', () => {
      expect(can(role, Permission.ACTIVITY_READ)).toBe(true);
      expect(can(role, Permission.PARTICIPATION_CREATE_OWN)).toBe(true);
      expect(can(role, Permission.HOUR_REQUEST_CREATE_OWN)).toBe(true);
      expect(can(role, Permission.HOUR_REQUEST_UPDATE_OWN)).toBe(true);
    });

    it('cannot manage activities, review requests or read other students', () => {
      expect(can(role, Permission.ACTIVITY_CREATE)).toBe(false);
      expect(can(role, Permission.ACTIVITY_DELETE)).toBe(false);
      expect(can(role, Permission.HOUR_REQUEST_REVIEW_ANY)).toBe(false);
      expect(can(role, Permission.HOUR_REQUEST_READ_ANY)).toBe(false);
      expect(can(role, Permission.HOUR_SUMMARY_READ_ANY)).toBe(false);
      expect(can(role, Permission.ATTENDANCE_UPDATE_ANY)).toBe(false);
    });
  });

  it('STAFF and ADMIN hold every permission', () => {
    for (const permission of Object.values(Permission)) {
      expect(can(SubsystemRole.STAFF, permission)).toBe(true);
      expect(can(SubsystemRole.ADMIN, permission)).toBe(true);
    }
  });

  it('ALUMNI holds nothing', () => {
    expect(ROLE_PERMISSIONS[SubsystemRole.ALUMNI]).toHaveLength(0);
  });

  it('canAny passes when at least one permission matches', () => {
    expect(
      canAny(SubsystemRole.STUDENT, [Permission.HOUR_REQUEST_READ_ANY, Permission.HOUR_REQUEST_READ_OWN]),
    ).toBe(true);
    expect(canAny(SubsystemRole.STUDENT, [Permission.ACTIVITY_CREATE])).toBe(false);
  });

  it('uses the <resource>:<action>[:own|:any] naming format', () => {
    for (const permission of Object.values(Permission)) {
      expect(permission).toMatch(/^[a-z-]+:[a-z-]+(:own|:any)?$/);
    }
  });
});
