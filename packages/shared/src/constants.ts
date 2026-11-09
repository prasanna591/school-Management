export const TENANT_PREFIX = "tenant";

export const LANGUAGES = ["en", "ta", "hi"] as const;
export type Language = (typeof LANGUAGES)[number];

export const DEFAULT_LANGUAGE: Language = "en";

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "half-day",
  "medical-leave",
  "approved-leave",
] as const;
export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const STUDENT_STATUS_LIFECYCLE = [
  "enquiry",
  "applicant",
  "admitted",
  "active",
  "promoted",
  "transferred",
  "withdrawn",
  "alumni",
] as const;
export type StudentStatus = (typeof STUDENT_STATUS_LIFECYCLE)[number];

export const FEE_PAYMENT_CHANNELS = [
  "upi",
  "card",
  "net_banking",
  "cash",
  "cheque",
  "dd",
  "bank_transfer",
  "payment_link",
] as const;
export type FeePaymentChannel = (typeof FEE_PAYMENT_CHANNELS)[number];

export const NOTIFICATION_CATEGORIES = [
  "attendance",
  "fees",
  "notices",
  "homework",
  "exams",
  "transport",
  "messages",
  "emergency",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

export const SYNC_ENTITIES = [
  "attendance",
  "marks",
  "homework_submissions",
  "leave_requests",
] as const;
export type SyncEntity = (typeof SYNC_ENTITIES)[number];

export const MONEY_PRECISION = 100; // paise per rupee

export const API_ERROR_CODES = {
  VALIDATION: "validation_error",
  NOT_FOUND: "not_found",
  FORBIDDEN: "forbidden",
  UNAUTHORIZED: "unauthorized",
  TENANT_ISOLATION: "tenant_isolation_violation",
  EXAM_LOCKED: "exam_locked",
  IDEMPOTENCY_CONFLICT: "idempotency_conflict",
  RATE_LIMITED: "rate_limited",
} as const;

export const DEMO_SCHOOL_SLUG = "demo-school";
