export const APP_NAME = "SmartSchool"
export const DEMO_SCHOOL_SLUG = "demo-school"

export const ROLES = [
  "super_admin",
  "trustee",
  "principal",
  "admin",
  "accountant",
  "admission_counsellor",
  "teacher",
  "class_teacher",
  "parent",
  "student",
  "driver",
  "attendant",
  "gate_staff",
  "librarian",
  "nurse",
] as const

export const LANGUAGES = ["en", "ta", "hi"] as const
export type Language = (typeof LANGUAGES)[number]

export const NOTIFICATION_CATEGORIES = [
  "attendance",
  "fees",
  "notices",
  "homework",
  "exams",
  "transport",
  "messages",
  "emergency",
] as const
