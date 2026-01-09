// lib/access-logic.ts

/**
 * Centralized logic to determine if a user can access a specific premium report.
 * Supports Roles, Time-based Subscriptions, Individual Purchases, and Promo Unlocks.
 */
const REPORT_EXPIRES_FIELD: Record<1 | 2 | 3, string> = {
  1: "report_1_expires_at",
  2: "report_2_expires_at",
  3: "report_3_expires_at",
};

const TESTER_ACCESS_LEVEL = "tester";
const TESTER_EXPIRES_FIELD = "access_expires_at";

function isFutureDate(value: any) {
  if (!value) return false;
  const d = new Date(value);
  return Number.isFinite(d.getTime()) && d > new Date();
}

export function hasTesterAccess(profile: any): boolean {
  if (!profile) return false;
  if (profile?.access_level !== TESTER_ACCESS_LEVEL) return false;
  return isFutureDate(profile?.[TESTER_EXPIRES_FIELD]);
}

export function hasReportAccess(profile: any, reportIndex: 1 | 2 | 3): boolean {
  if (!profile) return false;
  if (hasTesterAccess(profile)) return true;
  const boolField = `has_access_report_${reportIndex}`;
  if (profile?.[boolField] === true) return true;

  const expField = REPORT_EXPIRES_FIELD[reportIndex];
  const exp = profile?.[expField];
  if (!exp) return false;

  return new Date(exp) > new Date();
}

export function hasReportAccessByKey(profile: any, reportKey: string): boolean {
  const map: Record<string, 1 | 2 | 3> = {
    relationship: 1,
    "drain-analysis": 2,
    "profession-fit": 3,
  };
  const idx = map[reportKey];
  if (!idx) return false;
  return hasReportAccess(profile, idx);
}

export function checkAccess(
  reportKey: string,
  profile: any,
  entitlements: any[] | null
): boolean {
  const internalRoles = ["admin", "assistant"];
  if (profile?.role && internalRoles.includes(profile.role)) {
    return true;
  }

  if (hasTesterAccess(profile)) return true;

  if (profile?.sub_expires_at) {
    const isSubscribed = new Date(profile.sub_expires_at) > new Date();
    if (isSubscribed) return true;
  }

  if (hasReportAccessByKey(profile, reportKey)) return true;

  if (!entitlements) return false;

  const hasValidEntitlement = entitlements.some(
    (ent) => ent.item_key === reportKey && ent.status === "active"
  );

  return hasValidEntitlement;
}

/**
 * Helper to check specific administrative permissions
 */
export const PERMISSIONS = {
  CAN_MANAGE_PROMOS: ['admin', 'assistant'],
  CAN_EDIT_CREDITS: ['admin'],
  CAN_CHANGE_ROLES: ['admin'],
};

export function hasPermission(role: string | undefined, action: keyof typeof PERMISSIONS) {
  if (!role) return false;
  return PERMISSIONS[action].includes(role);
}
