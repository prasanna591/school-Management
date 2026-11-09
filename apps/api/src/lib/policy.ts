import { eq } from "drizzle-orm";
import { db, guardians, students } from "../db/index";

export type Role =
  | "super_admin"
  | "trustee"
  | "principal"
  | "admin"
  | "accountant"
  | "admission_counsellor"
  | "teacher"
  | "class_teacher"
  | "parent"
  | "student"
  | "driver"
  | "attendant"
  | "gate_staff"
  | "librarian"
  | "nurse";

export type Permission = "view" | "create" | "edit" | "approve" | "export";

// Tenant-scoped roles that can see all data in their tenant
const TENANT_ADMIN_ROLES: Role[] = [
  "super_admin",
  "trustee",
  "principal",
  "admin",
  "accountant",
];

// Roles that manage students (teachers)
const STAFF_ROLES: Role[] = ["teacher", "class_teacher"];

/**
 * Single policy function for object-level authorization (BOLA/IDOR protection).
 * Returns true if the actor can access the target object.
 */
export async function canAccessObject({
  actor,
  targetType,
  targetId,
}: {
  actor: { userId: string; role: string; tenantId: string };
  targetType: "student" | "self" | "trip" | "any";
  targetId: string;
}): Promise<boolean> {
  // Super admin / trustee can access anything in their tenant
  if (actor.role === "super_admin" || actor.role === "trustee") {
    return true;
  }

  switch (targetType) {
    case "self":
      // Users can only access their own record
      return actor.userId === targetId;

    case "student": {
      // Tenant admins and staff can access any student in their tenant
      if (
        TENANT_ADMIN_ROLES.includes(actor.role as Role) ||
        STAFF_ROLES.includes(actor.role as Role)
      ) {
        const [s] = await db
          .select({ id: students.id, tenantId: students.tenantId })
          .from(students)
          .where(eq(students.id, targetId))
          .limit(1);
        return Boolean(s && s.tenantId === actor.tenantId);
      }
      // Parents can only access their linked children
      if (actor.role === "parent") {
        const [g] = await db
          .select({ studentId: guardians.studentId })
          .from(guardians)
          .where(eq(guardians.userId as any, actor.userId))
          .limit(1);
        return Boolean(g && g.studentId === targetId);
      }
      return false;
    }

    case "trip": {
      // Drivers can only access their own trips
      if (actor.role === "driver") {
        return actor.userId === targetId;
      }
      // Tenant admins can access any trip in their tenant
      if (TENANT_ADMIN_ROLES.includes(actor.role as Role)) {
        return true;
      }
      return false;
    }

    case "any":
      return true;

    default:
      return false;
  }
}

/**
 * Check if an actor has a given permission on their tenant.
 * In a full implementation this would query the role_permissions table.
 * For now, role-based defaults are applied.
 */
export function hasPermission({
  actor,
  permission,
}: {
  actor: { role: string };
  permission: Permission;
}): boolean {
  const role = actor.role as Role;

  const defaults: Record<Role, Permission[]> = {
    super_admin: ["view", "create", "edit", "approve", "export"],
    trustee: ["view", "create", "edit", "approve", "export"],
    principal: ["view", "create", "edit", "approve", "export"],
    admin: ["view", "create", "edit", "approve", "export"],
    accountant: ["view", "create", "edit", "approve", "export"],
    admission_counsellor: ["view", "create", "edit", "export"],
    teacher: ["view", "create", "edit"],
    class_teacher: ["view", "create", "edit"],
    parent: ["view"],
    student: ["view"],
    driver: ["view", "edit"],
    attendant: ["view", "edit"],
    gate_staff: ["view", "edit"],
    librarian: ["view", "create", "edit"],
    nurse: ["view", "create", "edit"],
  };

  return (defaults[role] ?? []).includes(permission);
}

/**
 * List of child-scoped routes that require object-level authorization.
 * Each entry: method, path pattern, param name for the object id, target type.
 */
export const CHILD_SCOPED_ROUTES = [
  { method: "GET", path: "/students/:id", param: "id", targetType: "student" as const },
  { method: "GET", path: "/students/:studentId/dues", param: "studentId", targetType: "student" as const },
  { method: "GET", path: "/attendance/sessions/:id/records", param: "id", targetType: "student" as const },
  { method: "GET", path: "/exams/:id/marks", param: "id", targetType: "student" as const },
  { method: "GET", path: "/students/:studentId/report-card", param: "studentId", targetType: "student" as const },
  { method: "GET", path: "/homeworks/:id/submissions", param: "id", targetType: "student" as const },
  { method: "GET", path: "/library/issues", param: "none", targetType: "any" as const },
  { method: "GET", path: "/transport/trips/:id/points", param: "id", targetType: "trip" as const },
  { method: "GET", path: "/payments", param: "none", targetType: "any" as const },
] as const;
