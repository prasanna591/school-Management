import { pgTable, uuid, text, timestamp, boolean, integer, pgEnum, jsonb, index } from "drizzle-orm/pg-core";

export const tenantStatusEnum = pgEnum("tenant_status", ["active", "suspended", "archived"]);
export const userStatusEnum = pgEnum("user_status", ["active", "inactive", "locked"]);
export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "late",
  "half-day",
  "medical-leave",
  "approved-leave",
]);
export const studentStatusEnum = pgEnum("student_status", [
  "enquiry",
  "applicant",
  "admitted",
  "active",
  "promoted",
  "transferred",
  "withdrawn",
  "alumni",
]);
export const feeLedgerTypeEnum = pgEnum("fee_ledger_type", [
  "charge",
  "payment",
  "refund",
  "concession",
  "fine",
  "carry_forward",
]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "success", "failed", "refunded"]);
export const paymentChannelEnum = pgEnum("payment_channel", [
  "upi",
  "card",
  "net_banking",
  "cash",
  "cheque",
  "dd",
  "bank_transfer",
  "payment_link",
]);

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    board: text("board").notNull(),
    affiliationNumber: text("affiliation_number"),
    address: text("address"),
    contactPhone: text("contact_phone"),
    contactEmail: text("contact_email"),
    brandingLogoUrl: text("branding_logo_url"),
    brandingPrimaryColor: text("branding_primary_color"),
    academicYearStart: timestamp("academic_year_start"),
    academicYearEnd: timestamp("academic_year_end"),
    defaultLanguage: text("default_language").notNull().default("en"),
    settings: jsonb("settings").notNull().default({}),
    status: tenantStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("tenants_slug_idx").on(t.slug)]
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    email: text("email").unique(),
    phone: text("phone").notNull(),
    passwordHash: text("password_hash"),
    role: text("role").notNull().default("parent"),
    status: userStatusEnum("status").notNull().default("active"),
    isMfaEnabled: boolean("is_mfa_enabled").notNull().default(false),
    emailVerified: boolean("email_verified").notNull().default(false),
    phoneVerified: boolean("phone_verified").notNull().default(false),
    lastLoginAt: timestamp("last_login_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("users_tenant_id_idx").on(t.tenantId),
    index("users_phone_idx").on(t.phone),
  ]
);

export const roles = pgTable(
  "roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isSystem: boolean("is_system").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("roles_tenant_id_idx").on(t.tenantId)]
);

export const permissions = pgTable(
  "permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    key: text("key").notNull().unique(),
    description: text("description"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("permissions_key_idx").on(t.key)]
);

export const rolePermissions = pgTable(
  "role_permissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    permissionId: uuid("permission_id")
      .notNull()
      .references(() => permissions.id, { onDelete: "cascade" }),
  },
  (t) => [
    index("role_permissions_role_id_idx").on(t.roleId),
    index("role_permissions_permission_id_idx").on(t.permissionId),
  ]
);

export const userRoles = pgTable(
  "user_roles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    roleId: uuid("role_id")
      .notNull()
      .references(() => roles.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("user_roles_user_id_idx").on(t.userId),
    index("user_roles_role_id_idx").on(t.roleId),
  ]
);

export const academicYears = pgTable(
  "academic_years",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    isCurrent: boolean("is_current").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("academic_years_tenant_id_idx").on(t.tenantId)]
);

export const classes = pgTable(
  "classes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    grade: text("grade").notNull(),
    capacity: integer("capacity").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("classes_tenant_id_idx").on(t.tenantId)]
);

export const sections = pgTable(
  "sections",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    capacity: integer("capacity").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("sections_tenant_id_idx").on(t.tenantId), index("sections_class_id_idx").on(t.classId)]
);

export const students = pgTable(
  "students",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    admissionNumber: text("admission_number").notNull(),
    admissionDate: timestamp("admission_date").notNull().defaultNow(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name"),
    dob: timestamp("dob"),
    gender: text("gender"),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "set null" }),
    sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }),
    rollNumber: text("roll_number"),
    pen: text("pen"),
    apaarId: text("apaar_id"),
    aadhaarToken: text("aadhaar_token"),
    bloodGroup: text("blood_group"),
    address: text("address"),
    previousSchool: text("previous_school"),
    photoUrl: text("photo_url"),
    status: studentStatusEnum("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("students_tenant_id_idx").on(t.tenantId),
    index("students_admission_number_idx").on(t.admissionNumber),
    index("students_class_id_idx").on(t.classId),
    index("students_status_idx").on(t.status),
  ]
);

export const guardians = pgTable(
  "guardians",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    relationship: text("relationship").notNull(),
    phone: text("phone").notNull(),
    email: text("email"),
    isPrimary: boolean("is_primary").notNull().default(false),
    isAuthorizedPickup: boolean("is_authorized_pickup").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("guardians_tenant_id_idx").on(t.tenantId),
    index("guardians_student_id_idx").on(t.studentId),
    index("guardians_phone_idx").on(t.phone),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id").notNull().references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("audit_logs_tenant_id_idx").on(t.tenantId),
    index("audit_logs_entity_idx").on(t.entityType, t.entityId),
    index("audit_logs_created_at_idx").on(t.createdAt),
  ]
);

export const consentRecords = pgTable(
  "consent_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    purpose: text("purpose").notNull(),
    textVersion: text("text_version").notNull(),
    givenAt: timestamp("given_at").notNull().defaultNow(),
    withdrawnAt: timestamp("withdrawn_at"),
    verifiedHow: text("verified_how"),
  },
  (t) => [
    index("consent_records_tenant_id_idx").on(t.tenantId),
    index("consent_records_user_id_idx").on(t.userId),
  ]
);

export const attendanceSessions = pgTable(
  "attendance_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }),
    date: timestamp("date").notNull(),
    period: text("period"),
    isLocked: boolean("is_locked").notNull().default(false),
    submittedBy: uuid("submitted_by").references(() => users.id, { onDelete: "set null" }),
    submittedAt: timestamp("submitted_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("attendance_sessions_tenant_id_idx").on(t.tenantId),
    index("attendance_sessions_class_date_idx").on(t.classId, t.date),
    index("attendance_sessions_tenant_date_idx").on(t.tenantId, t.date),
  ]
);

export const attendanceRecord = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => attendanceSessions.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    status: attendanceStatusEnum("status").notNull().default("present"),
    remark: text("remark"),
    markedBy: uuid("marked_by").references(() => users.id, { onDelete: "set null" }),
    markedAt: timestamp("marked_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("attendance_records_tenant_id_idx").on(t.tenantId),
    index("attendance_records_session_id_idx").on(t.sessionId),
    index("attendance_records_student_id_idx").on(t.studentId),
  ]
);

export const feeHeads = pgTable(
  "fee_heads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    description: text("description"),
    isOptional: boolean("is_optional").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("fee_heads_tenant_id_idx").on(t.tenantId)]
);

export const feeStructures = pgTable(
  "fee_structures",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }),
    term: text("term").notNull(),
    feeHeadId: uuid("fee_head_id")
      .notNull()
      .references(() => feeHeads.id, { onDelete: "cascade" }),
    amountPaise: integer("amount_paise").notNull(),
    dueDate: timestamp("due_date"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("fee_structures_tenant_id_idx").on(t.tenantId),
    index("fee_structures_class_term_idx").on(t.classId, t.term),
  ]
);

export const feeLedgerEntries = pgTable(
  "fee_ledger_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    type: feeLedgerTypeEnum("type").notNull(),
    amountPaise: integer("amount_paise").notNull(),
    reference: text("reference"),
    description: text("description"),
    occurredAt: timestamp("occurred_at").notNull().defaultNow(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("fee_ledger_entries_tenant_id_idx").on(t.tenantId),
    index("fee_ledger_entries_student_id_idx").on(t.studentId),
    index("fee_ledger_entries_occurred_at_idx").on(t.occurredAt),
  ]
);

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    gateway: text("gateway"),
    gatewayReference: text("gateway_reference"),
    amountPaise: integer("amount_paise").notNull(),
    channel: paymentChannelEnum("channel"),
    status: paymentStatusEnum("status").notNull().default("pending"),
    idempotencyKey: text("idempotency_key").unique(),
    receiptNumber: text("receipt_number"),
    paidAt: timestamp("paid_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("payments_tenant_id_idx").on(t.tenantId),
    index("payments_student_id_idx").on(t.studentId),
    index("payments_idempotency_key_idx").on(t.idempotencyKey),
  ]
);
