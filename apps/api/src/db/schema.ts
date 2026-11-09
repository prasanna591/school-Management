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

export const notices = pgTable(
  "notices",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body"),
    audience: text("audience").notNull(),
    audienceIds: jsonb("audience_ids").notNull().default([]),
    publishedAt: timestamp("published_at"),
    expiresAt: timestamp("expires_at"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("notices_tenant_id_idx").on(t.tenantId),
    index("notices_published_at_idx").on(t.publishedAt),
  ]
);

export const messageThreads = pgTable(
  "message_threads",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    title: text("title"),
    participantIds: jsonb("participant_ids").notNull().default([]),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("message_threads_tenant_id_idx").on(t.tenantId)]
);

export const messageMessages = pgTable(
  "message_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    threadId: uuid("thread_id")
      .notNull()
      .references(() => messageThreads.id, { onDelete: "cascade" }),
    senderId: uuid("sender_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    body: text("body").notNull(),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("message_messages_tenant_id_idx").on(t.tenantId),
    index("message_messages_thread_id_idx").on(t.threadId),
    index("message_messages_created_at_idx").on(t.createdAt),
  ]
);

export const homeworks = pgTable(
  "homeworks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    classId: uuid("class_id")
      .notNull()
      .references(() => classes.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    title: text("title").notNull(),
    description: text("description"),
    dueDate: timestamp("due_date"),
    submissionType: text("submission_type").notNull().default("none"),
    createdBy: uuid("created_by").references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("homeworks_tenant_id_idx").on(t.tenantId),
    index("homeworks_class_section_idx").on(t.classId, t.sectionId),
  ]
);

export const homeworkSubmissions = pgTable(
  "homework_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    homeworkId: uuid("homework_id")
      .notNull()
      .references(() => homeworks.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    fileUrl: text("file_url"),
    textAnswer: text("text_answer"),
    status: text("status").notNull().default("submitted"),
    feedback: text("feedback"),
    submittedAt: timestamp("submitted_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("homework_submissions_tenant_id_idx").on(t.tenantId),
    index("homework_submissions_homework_id_idx").on(t.homeworkId),
    index("homework_submissions_student_id_idx").on(t.studentId),
  ]
);

export const exams = pgTable(
  "exams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    term: text("term").notNull(),
    classId: uuid("class_id").references(() => classes.id, { onDelete: "cascade" }),
    sectionId: uuid("section_id").references(() => sections.id, { onDelete: "set null" }),
    subject: text("subject").notNull(),
    maxMarks: integer("max_marks").notNull(),
    passMarks: integer("pass_marks").notNull(),
    isLocked: boolean("is_locked").notNull().default(false),
    publishedAt: timestamp("published_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("exams_tenant_id_idx").on(t.tenantId),
    index("exams_class_term_idx").on(t.classId, t.term),
    index("exams_is_locked_idx").on(t.isLocked),
  ]
);

export const marksEntries = pgTable(
  "marks_entries",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    examId: uuid("exam_id")
      .notNull()
      .references(() => exams.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    marksObtained: integer("marks_obtained").notNull(),
    status: text("status").notNull().default("present"),
    grade: text("grade"),
    enteredBy: uuid("entered_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("marks_entries_tenant_id_idx").on(t.tenantId),
    index("marks_entries_exam_id_idx").on(t.examId),
    index("marks_entries_student_id_idx").on(t.studentId),
  ]
);

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    registrationNumber: text("registration_number").notNull(),
    type: text("type").notNull(),
    capacity: integer("capacity").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("vehicles_tenant_id_idx").on(t.tenantId)]
);

export const routes = pgTable(
  "routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    driverId: uuid("driver_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("routes_tenant_id_idx").on(t.tenantId)]
);

export const stops = pgTable(
  "stops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    sequence: integer("sequence").notNull(),
    expectedTime: text("expected_time"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("stops_tenant_id_idx").on(t.tenantId), index("stops_route_id_idx").on(t.routeId)]
);

export const trips = pgTable(
  "trips",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    driverId: uuid("driver_id").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull().default("scheduled"),
    startedAt: timestamp("started_at"),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [index("trips_tenant_id_idx").on(t.tenantId), index("trips_route_id_idx").on(t.routeId)]
);

export const tripPoints = pgTable(
  "trip_points",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    latitude: text("latitude").notNull(),
    longitude: text("longitude").notNull(),
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  },
  (t) => [index("trip_points_trip_id_idx").on(t.tripId), index("trip_points_tenant_id_idx").on(t.tenantId)]
);

export const boardingEvents = pgTable(
  "boarding_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    tripId: uuid("trip_id")
      .notNull()
      .references(() => trips.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "set null" }),
    stopId: uuid("stop_id").references(() => stops.id, { onDelete: "set null" }),
    type: text("type").notNull(),
    recordedAt: timestamp("recorded_at").notNull().defaultNow(),
  },
  (t) => [
    index("boarding_events_tenant_id_idx").on(t.tenantId),
    index("boarding_events_trip_id_idx").on(t.tripId),
  ]
);

export const gatePasses = pgTable(
  "gate_passes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id")
      .notNull()
      .references(() => students.id, { onDelete: "cascade" }),
    guardianName: text("guardian_name").notNull(),
    guardianPhone: text("guardian_phone").notNull(),
    qrCode: text("qr_code").notNull().unique(),
    expiresAt: timestamp("expires_at").notNull(),
    usedAt: timestamp("used_at"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("gate_passes_tenant_id_idx").on(t.tenantId),
    index("gate_passes_qr_code_idx").on(t.qrCode),
    index("gate_passes_student_id_idx").on(t.studentId),
  ]
);

export const visitorLogs = pgTable(
  "visitor_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    visitorName: text("visitor_name").notNull(),
    visitorPhone: text("visitor_phone"),
    purpose: text("purpose"),
    hostId: uuid("host_id").references(() => users.id, { onDelete: "set null" }),
    checkIn: timestamp("check_in").notNull().defaultNow(),
    checkOut: timestamp("check_out"),
    status: text("status").notNull().default("checked_in"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("visitor_logs_tenant_id_idx").on(t.tenantId),
    index("visitor_logs_status_idx").on(t.status),
  ]
);

export const admissions = pgTable(
  "admissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    childName: text("child_name").notNull(),
    childDob: timestamp("child_dob"),
    parentName: text("parent_name").notNull(),
    parentPhone: text("parent_phone").notNull(),
    parentEmail: text("parent_email"),
    source: text("source").notNull(),
    stage: text("stage").notNull().default("new"),
    followUpDate: timestamp("follow_up_date"),
    notes: text("notes"),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("admissions_tenant_id_idx").on(t.tenantId),
    index("admissions_parent_phone_idx").on(t.parentPhone),
    index("admissions_stage_idx").on(t.stage),
    index("admissions_status_idx").on(t.status),
  ]
);

export const approvals = pgTable(
  "approvals",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    requestedBy: uuid("requested_by").references(() => users.id, { onDelete: "set null" }),
    status: text("status").notNull().default("pending"),
    decision: text("decision"),
    decidedBy: uuid("decided_by").references(() => users.id, { onDelete: "set null" }),
    decidedAt: timestamp("decided_at"),
    comment: text("comment"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("approvals_tenant_id_idx").on(t.tenantId),
    index("approvals_entity_idx").on(t.entityType, t.entityId),
    index("approvals_status_idx").on(t.status),
  ]
);

export const leaveRequests = pgTable(
  "leave_requests",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    studentId: uuid("student_id").references(() => students.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    startDate: timestamp("start_date").notNull(),
    endDate: timestamp("end_date").notNull(),
    reason: text("reason").notNull(),
    status: text("status").notNull().default("pending"),
    approvedBy: uuid("approved_by").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("leave_requests_tenant_id_idx").on(t.tenantId),
    index("leave_requests_student_id_idx").on(t.studentId),
    index("leave_requests_status_idx").on(t.status),
  ]
);

export const grievances = pgTable(
  "grievances",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    category: text("category").notNull(),
    subject: text("subject").notNull(),
    description: text("description"),
    status: text("status").notNull().default("open"),
    assigneeId: uuid("assignee_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    index("grievances_tenant_id_idx").on(t.tenantId),
    index("grievances_user_id_idx").on(t.userId),
    index("grievances_status_idx").on(t.status),
  ]
);
