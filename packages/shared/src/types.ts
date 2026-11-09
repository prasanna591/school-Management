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

export type PermissionAction = "view" | "create" | "edit" | "approve" | "export";

export interface User {
  id: string;
  tenantId: string;
  email: string | null;
  phone: string;
  role: string;
  isMfaEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  board: string;
  affiliationNumber: string | null;
  address: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  brandingLogoUrl: string | null;
  brandingPrimaryColor: string | null;
  academicYearStart: Date | null;
  academicYearEnd: Date | null;
  defaultLanguage: string;
  isActive: boolean;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Student {
  id: string;
  tenantId: string;
  admissionNumber: string;
  admissionDate: Date;
  firstName: string;
  lastName: string;
  dob: Date | null;
  gender: string | null;
  classId: string | null;
  sectionId: string | null;
  rollNumber: string | null;
  pen: string | null;
  apaarId: string | null;
  aadhaarToken: string | null;
  bloodGroup: string | null;
  address: string | null;
  previousSchool: string | null;
  photoUrl: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Guardian {
  id: string;
  tenantId: string;
  studentId: string;
  name: string;
  relationship: string;
  phone: string;
  email: string | null;
  isPrimary: boolean;
  isAuthorizedPickup: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassRoom {
  id: string;
  tenantId: string;
  name: string;
  grade: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Section {
  id: string;
  tenantId: string;
  classId: string;
  name: string;
  capacity: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceSession {
  id: string;
  tenantId: string;
  classId: string;
  sectionId: string;
  date: Date;
  period: string | null;
  isLocked: boolean;
  submittedBy: string | null;
  submittedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AttendanceRecord {
  id: string;
  tenantId: string;
  sessionId: string;
  studentId: string;
  status: string;
  remark: string | null;
  markedBy: string;
  markedAt: Date;
  updatedAt: Date;
}

export interface FeeHead {
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  isOptional: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeStructure {
  id: string;
  tenantId: string;
  classId: string | null;
  categoryId: string | null;
  term: string | null;
  feeHeadId: string;
  amountPaise: number;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface FeeLedgerEntry {
  id: string;
  tenantId: string;
  studentId: string;
  type: "charge" | "payment" | "refund" | "concession" | "fine" | "carry_forward";
  amountPaise: number;
  reference: string | null;
  description: string | null;
  occurredAt: Date;
  createdAt: Date;
}

export interface Payment {
  id: string;
  tenantId: string;
  studentId: string;
  gateway: string | null;
  gatewayReference: string | null;
  amountPaise: number;
  channel: string | null;
  status: "pending" | "success" | "failed" | "refunded";
  idempotencyKey: string | null;
  receiptNumber: string | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Notice {
  id: string;
  tenantId: string;
  title: string;
  body: string | null;
  audience: string;
  audienceIds: string[];
  publishedAt: Date | null;
  expiresAt: Date | null;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Homework {
  id: string;
  tenantId: string;
  classId: string;
  sectionId: string;
  subject: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  submissionType: "none" | "photo" | "pdf" | "text";
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface SyncCursor {
  entity: string;
  cursor: string;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
}

export interface ConsentRecord {
  id: string;
  tenantId: string;
  userId: string;
  purpose: string;
  textVersion: string;
  givenAt: Date;
  withdrawnAt: Date | null;
  verifiedHow: string | null;
}
