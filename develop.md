# SmartSchool: Functional Spec + Mobile App Implementation Prompt

Companion to the Build Brief. **All code-economy, git, security, multi-tenancy and Definition-of-Done rules from the Build Brief still apply.** This document defines **what each module must do** and **how the mobile app must be built**.

Ground rules for using this spec:
- Inspect the existing repo first. Keep the existing stack; the defaults below apply only where nothing exists.
- Build in the order in section 9. Do not start a module before its dependencies exist.
- Every business rule below is a requirement. Where a rule is ambiguous, pick the simplest reading, record the assumption in the PR, and move on.
- If a rule can be a database config row instead of code, make it config.
- Write the least code that works: use libraries and platform features before custom code.

---

## 1. Mobile app: architecture and implementation

### 1.1 Delivery model
- **One shared app** for parents, students, teachers, staff and drivers. The user enters a **school code** (or scans the school's QR) and then logs in. The home screen, tabs and permissions come from the user's role.
- Per-tenant branding (logo, colours, school name) loads at runtime after the school code is resolved. Do not create per-school builds now; keep the config so white-label builds could be added later via build profiles.
- Android first (most users), iOS in parallel from the same codebase.

### 1.2 Default stack (use existing equivalents if the repo already has them)
- Expo (React Native) + TypeScript, Expo Router for navigation
- Server state: TanStack Query with persisted cache
- Local database for offline entities: `expo-sqlite` with one small sync layer (do not add a second database library)
- Small global state: Zustand (session, tenant, language only)
- Forms: React Hook Form + the shared Zod schemas from `packages/shared`
- Lists: FlashList for anything over ~30 rows
- Secure storage: `expo-secure-store` for tokens; `expo-local-authentication` for optional app lock
- Push: `expo-notifications` (FCM on Android, APNs on iOS)
- Files: `expo-image-picker`, `expo-image-manipulator` (compress before upload), `expo-document-picker`
- Scanning: `expo-camera` (QR for school code, gate pass, ID verification)
- Location (driver only): `expo-location` + `expo-task-manager`
- i18n: `expo-localization` + `i18next`; all strings in resource files; start with English, Tamil, Hindi
- Updates and builds: EAS Build and EAS Update; crash reporting with one provider (Sentry or equivalent)
- Tests: Jest + React Native Testing Library for logic and critical screens; Maestro (or equivalent) for 5 to 8 end-to-end flows

Install only the packages you actually use. Remove any that end up unused.

### 1.3 Folder structure (apps/mobile)
```
app/                 # Expo Router routes, grouped by role: (parent), (teacher), (student), (staff), (driver), (auth)
src/features/<module>/   # screens' logic, hooks, components for one module (attendance, fees, ...)
src/components/      # shared UI primitives only (Button, Card, Field, EmptyState, ListItem, Sheet)
src/lib/             # api client, db, sync, push, i18n, theme, session
```
Rules: no business logic in route files; no feature imports another feature's internals; shared types come from `packages/shared`.

### 1.4 Authentication and session
- Parents/students/staff log in with **mobile number + OTP**. Use a DLT-registered SMS template for OTP in India (SMS templates must be pre-registered on the operator platform; note this in the docs as a deployment prerequisite). Optional email login for staff.
- After first login: optional **PIN or biometric app lock**, never storing the OTP.
- Access token short-lived, refresh token in secure storage, silent refresh, forced logout on revocation.
- **Multi-child parents:** one login, a child switcher in the header, and the selected child persists. Parent with children in two schools: school switcher.
- **Multi-role users** (a teacher who is also a parent): role switcher in profile; the role changes tabs and data scope.
- Device registration: store push token + device info per session; log out removes it.
- Session list in settings with "log out other devices".

### 1.5 Offline-first design
Works offline: attendance marking, marks entry, homework viewing, timetable, notices already fetched, student lists, driver stop checklist. Everything else shows cached data with a "last updated" label and a clear offline banner.

Sync design (keep it small):
1. **Pull:** per entity, `GET /sync/<entity>?since=<cursor>` returns changed rows and deletions plus a new cursor. The app stores rows in SQLite and the cursor per entity.
2. **Push:** an **outbox table** records each local write with a client-generated UUID, entity, payload, timestamp, retry count. A background routine sends outbox items in order when online; the server is **idempotent** on the UUID.
3. **Conflict rules (decide per entity, store in one config map):**
   - Attendance: server keeps the latest edit by a user with edit rights for that class and date; teacher edits after lock require admin approval.
   - Marks: reject writes to a locked exam; otherwise last write wins, with an audit entry.
   - Homework submissions: append-only.
4. **Triggers:** on app open, on network regained, on pull-to-refresh, after a push notification of type "data changed", and via periodic background fetch (OS permitting).
5. Show sync state in the UI: "Saved on device, will sync" with a pending counter in settings; failures show a retry button and a reason.
6. Tests required: offline mark then sync, duplicate send (idempotency), conflict with a locked exam, token expiry mid-sync.

### 1.6 Push notifications and in-app inbox
- Every notification is also stored in an **in-app inbox** (server-side) so nothing is lost if push fails or is disabled.
- Categories with per-user toggles: attendance, fees, notices, homework, exams/results, transport, messages, emergency. **Emergency cannot be muted.**
- Tapping a notification deep-links to the exact screen (notice, fee due, child's attendance day, bus tracking).
- Notification channels on Android per category; quiet hours setting; badge counts.
- Local reminders (opt-in): fee due date, exam day, homework due.
- WhatsApp: the server sends template messages; the app offers "Open in WhatsApp" only for opt-in parent chat where applicable. Message templates must be pre-approved by Meta; list the templates needed in `/docs`.

### 1.7 Payments in the app
- Use **one** payment gateway SDK or hosted checkout (use whichever the repo already uses; otherwise choose a major Indian gateway). UPI intent, UPI QR, cards, net banking.
- Flow: parent selects dues, optionally applies available advance or credit, sees an itemised summary, pays, gets a result screen, then a PDF receipt (download, share to WhatsApp).
- **Never mark a payment successful from the client.** The server marks success from the gateway webhook; the app polls or listens for status and shows "Processing" until confirmed.
- Handle: payment pending, failed, app killed mid-payment, duplicate tap (disable button, send idempotency key), receipt unavailable offline.
- UPI AutoPay mandate setup and cancellation screens (Phase 2).
- Never store card data. Never log payment payloads.

### 1.8 Media and files
- Compress images before upload (max ~1280 px longest side, quality tuned for readability of handwritten homework).
- Upload with retry; large files resumable if the backend supports it; progress and cancel.
- Documents (PDF) open in the system viewer; cache recent files.
- Gallery: lazy thumbnails, privacy: show only photos tagged to the user's child or class; no public download for restricted albums.

### 1.9 Driver GPS (transport)
- Driver starts a **trip**; only during an active trip is location collected (foreground service with a visible notification on Android). Send a point every ~10 to 15 seconds while moving, batch on weak network, stop at trip end.
- Parent bus screen shows the live map only for the child's assigned route while a trip is active; ETA to the child's stop; push alerts: trip started, bus near stop (distance threshold per stop), arrived, delayed.
- Battery-safe: reduce frequency when stationary; handle permission denial with a plain explanation screen.
- Privacy: no location history exposed to parents; admins see trip history with retention limit.

### 1.10 Security (mobile)
- Tokens only in secure storage; no personal data in logs or crash reports.
- Screens showing sensitive data (fees, results, documents) obey app lock timeout.
- Prevent screenshots only if the school enables it (config), default off.
- Validate all deep link params; no arbitrary URL loading in WebViews.
- Certificate pinning is optional; do not add it unless required.
- Rooted-device detection is not required; do not add it.

### 1.11 UX standards
- Bottom tabs, max 5 per role. One clear primary action per screen.
- Home = "Today" (see 3.x per role): what needs attention now, in order of urgency.
- Large touch targets, readable in sunlight, scalable text, high contrast, dark mode supported.
- Every screen has loading skeleton, empty state, error state with retry.
- Low-data mode: toggle that disables auto-loading images and background media sync.
- Language switch without restart. Dates, numbers, currency in Indian formats.
- No hardcoded strings. No custom UI primitives if a platform or library component exists.

### 1.12 Performance budgets (verify on a low-end Android phone)
- Cold start to usable "Today" screen: under 3 seconds with cached data.
- Attendance for a 60-student class: open, mark, submit in under 10 seconds.
- List scrolling stays smooth at 1,000 rows; no screen re-renders the whole list on a row change.
- Release APK/AAB size kept small; run a bundle analysis and remove heavy unused libraries.

### 1.13 Release and quality
- EAS build profiles: development, preview (internal testers), production.
- Staged rollout on Play Store; EAS Update for JS-only fixes; a minimum supported app version check from the API (force update screen when below).
- Crash-free sessions and sync-failure rate tracked. No third-party ad or behavioural analytics SDKs (children's data).
- CI: lint, typecheck, unit tests; preview build on pull request when practical.

### 1.14 API contract expectations (for mobile)
- Cursor pagination everywhere; `updated_at` and soft-delete markers for sync entities.
- Idempotency keys on every mutating request that the mobile outbox sends.
- Consistent error shape: `{ code, message, field_errors? }`; stable codes the app maps to translated messages.
- Versioned API with a minimum-client-version response header.
- Rate-limit responses carry retry-after; the app backs off.

---

## 2. Notification matrix (single source of truth)

| Event | Recipient | Channels | Notes |
|---|---|---|---|
| Student marked absent | Parent | Push, WhatsApp/SMS fallback | Sent after attendance submit; not repeated on edits unless status changes |
| Fee due in 7 / 3 / 1 days, overdue | Parent | Push, WhatsApp | Cadence configurable per school; stop on payment |
| Payment success / failure | Parent | Push, in-app, receipt | From webhook only |
| Notice / circular | Target audience | Push, optional WhatsApp/SMS | Delivery + read status tracked |
| Homework posted / due tomorrow | Student, parent | Push | Quiet hours respected |
| Result published | Parent, student | Push | Respects fee-hold rule if enabled |
| Bus trip started / near / arrived / delayed | Parents on route | Push | Only during active trip |
| Leave approved / rejected | Parent, teacher | Push | |
| Chat message | Recipient | Push | Mute by teacher office hours |
| Emergency broadcast | Everyone in scope | Push (non-mutable), SMS, WhatsApp | Requires admin role + confirmation |
| Document or vehicle expiry | Admin | Push, email | 30 / 7 days |
| Consent requested / withdrawn | Parent / admin | Push, in-app | Logged to consent ledger |

---

## 3. Role by role: mobile screens and actions

### 3.1 Parent (5 tabs: Today, Fees, Academics, Messages, More)
**Today:** child switcher; today's attendance status; homework due; unpaid dues banner with Pay button; latest notices (max 3); bus status card (if applicable); upcoming events.
**Attendance:** monthly calendar with present/absent/late/leave colours and text labels; percentage; apply for leave (date range, reason, optional attachment); leave status history.
**Fees:** outstanding items grouped by term, itemised heads, concessions shown, pay selected or all; payment history; download receipts; advance/credit balance; AutoPay setup (Phase 2); fee structure view.
**Academics:** timetable; homework list with submit-if-allowed; exam schedule; results and report cards (PDF download); progress card; teacher remarks.
**Messages:** notices inbox with unread filter; one thread per teacher (class teacher by default); office-hours display; PTM slot booking; polls/forms to respond; consent forms to sign.
**Bus:** live map, ETA, driver/vehicle details, report-an-issue.
**More:** child profile (view; request correction), documents download (certificates), gallery, events calendar, gate pass for authorised pickup (generate QR, add authorised guardians), grievance desk (create ticket, track status), language, notification settings, privacy and consent management (view and withdraw, request data export/erasure), log out.

### 3.2 Student (older classes; simplified)
Today, timetable, homework (view, submit photo/PDF), quizzes, results, calendar, digital ID, achievements. No payment or sensitive guardian data. Access governed by school config and the child's age band.

### 3.3 Teacher (5 tabs: Today, Attendance, Classes, Messages, More)
**Today:** my periods today, classes needing attendance, pending marks entry, substitutions assigned, pending leave approvals (if class teacher), unread parent messages.
**Attendance:** pick class/period, "all present" default, tap to mark absent/late/leave, remark, submit; works offline; edit window rules; staff's own attendance check-in (geo-fence if enabled).
**Classes:** student list with parent contact (tap-to-call and message within policy); homework create (text, photo, due date, attachment) with submissions review and feedback; marks entry grid with validation and offline save; diary entries; behaviour/achievement notes.
**Messages:** parent threads, class broadcast (within permission), notices created for own class.
**More:** timetable, leave application (own), payslips (Phase 3), resources, PTM schedule, profile, language, settings.

### 3.4 Principal / Admin (mobile = monitoring and approvals)
**Today dashboard:** attendance today (students, staff), fees collected today and dues, admissions funnel snapshot, alerts (chronic absence, fee defaulters, expiring documents, open grievances).
**Approvals:** concessions, leave, refunds, certificates, timetable substitutions, emergency broadcast confirmation. Approve or reject with comment in two taps.
**Directory:** search any student/staff/parent; view profile within permissions; quick call.
**Compose:** notice, emergency broadcast.
**Ask your data (Phase 3):** natural-language questions with source tables shown and no raw personal data in answers unless permitted.

### 3.5 Accountant (mobile counter collection)
Search student, view dues, record cash/cheque/UPI-at-counter payment, auto receipt (print/share), day-end summary, pending reconciliation list.

### 3.6 Driver / Attendant
Select route and vehicle, pre-trip checklist, start trip (GPS on), stop-by-stop list with expected students, scan/tap boarding and alighting, delay report, SOS (alerts admin and parents on route), end trip. Offline-tolerant: queue events, sync on reconnection.

### 3.7 Gate staff
Scan parent QR gate pass, verify authorised guardian and photo, record entry/exit, visitor registration (name, phone, purpose, whom to meet, photo optional), notify host, early dismissal approvals.

### 3.8 Librarian / Nurse / Store keeper (Phase 3)
Role-scoped lightweight screens: issue/return by barcode scan; infirmary visit log and parent notify; stock issue/receipt by scan.

---

## 4. Detailed functional rules by module

### 4.1 Foundation and tenant setup
- Onboarding wizard steps: school profile (name, address, board, affiliation number, contact), branding, academic year dates and terms, classes and sections with capacity, subjects, fee heads, roles, import students/staff (Excel template with validation preview and error report), connect messaging and payment accounts, go-live checklist.
- Academic year rollover: promote students (all/selected, with detention list), carry forward balances, archive previous year read-only, keep history queryable.
- Settings as data: attendance rules, edit windows, grading schemes, fee rules, language defaults, notification cadence, feature flags per tenant.
- Roles: system roles plus custom roles; permissions per module action (view, create, edit, approve, export); field-level hide for sensitive fields.
- Audit log viewable and filterable; exports are logged.

### 4.2 Student information
- Fields: name, DOB, gender, class/section/roll, admission number and date, PEN, APAAR ID, Aadhaar (stored tokenised/masked), blood group (optional), category fields (config), address, previous school and TC details, photo, siblings (auto-link by guardian phone), guardians (multiple, with relationship and primary contact flag), authorised pickup persons, medical notes (restricted role), documents.
- Duplicate detection on import and admission (name + DOB + guardian phone similarity) with a merge review screen.
- Status lifecycle: enquiry → applicant → admitted → active → promoted/transferred/withdrawn → alumni. Every transition audited.
- Parent correction requests: parent proposes a change; admin approves; history kept.
- Bulk operations: import, export, bulk section move, bulk promotion, bulk ID-card generation.

### 4.3 Attendance
- Modes: daily or period-wise per class (config). Statuses: present, absent, late, half-day, medical/approved leave.
- Default "all present"; teacher toggles exceptions; submit locks the session; edit window after submission configurable (e.g. same day), later edits need approval and are audited.
- Absence alert to the parent after submit; leave requests auto-mark days when approved.
- Rules: minimum percentage alert (config), chronic absence flag (e.g. a rolling threshold) shown to class teacher and principal as a **suggestion for human review**, never an automatic action.
- Staff attendance: app check-in with optional geo-fence, shifts, late marks, leave integration, monthly summary feeding payroll.
- Optional devices (QR/RFID/biometric/face): behind a tenant flag, consent captured first, data minimised; manual fallback always available.
- Reports: daily, monthly, class-wise, student-wise, defaulters; export.

### 4.4 Fees and finance
- **Structure:** fee heads (tuition, transport, hostel, activity, one-time), amounts by class/category/term, due dates, optional heads assigned per student, transport fee derived from route/stop.
- **Adjustments:** concession types (percentage/fixed, per head or total), scholarships, sibling and staff-ward discounts, each with an approval workflow and a reason; all reversible with audit.
- **Late fee:** rule per school (flat/per-day/capped, grace days); waiver requires approval.
- **Ledger model:** every charge, payment, refund, concession, fine and carry-forward is an entry; balances are computed. Money in paise. No editing of posted entries; corrections are reversing entries.
- **Payment channels:** online (UPI, cards, net banking), payment links via WhatsApp/SMS, counter (cash, cheque, DD, UPI QR), bank transfer with reference. Cheque bounce handling reverses and applies a fine.
- **Allocation:** partial payments allocate to oldest dues first or per rule; advances held as credit and auto-applied to the next charges.
- **Refunds:** request → approve → pay out (or credit); reasons recorded.
- **Receipts:** sequential numbering per school/year, PDF with school details, shared by WhatsApp; duplicate receipts are marked as copies.
- **Reconciliation:** gateway settlement import and bank statement matching; unmatched list with resolve actions; end-of-day closing with cash count.
- **Reminders:** configurable cadence, stop on payment, respect quiet hours, message templates in the parent's preferred language.
- **Reports:** collection (daily/term), dues ageing, defaulters, head-wise, concession report, refund report, reconciliation report, day book, export for accounting (Tally-compatible export in Phase 3).
- **Defaulter prediction (Phase 3):** a simple, explainable score from payment history, shown to admin as a suggestion only.

### 4.5 Communication
- Audience builder: all, class, section, role, individual, custom list, route, house.
- Message types: notice (with attachment), circular needing acknowledgement, poll, consent form (e-sign), event invite, emergency.
- Delivery: one composer, channel fallback order (push → WhatsApp → SMS) configurable; per-recipient delivery and read status; resend to undelivered; scheduled send.
- Two-way parent-teacher chat: text and attachments; office hours; auto-reply outside hours; admin visibility only on reported or flagged threads, with a clear policy notice; report/block abusive messages.
- Templates: stored per language with variables; Tamil/Hindi/English required at launch; template approval status tracked for WhatsApp.
- Grievance desk: parent ticket → category → assignee → status → resolution; SLA reminders.

### 4.6 Homework, diary, resources
- Teacher posts per class/subject/section: text, attachments, due date, optional submission type (none, photo, PDF, text).
- Student/parent submission with timestamp; teacher marks seen, gives feedback or grade; late flag.
- Daily diary entries and class updates; weekly summary option.
- Resources library by subject/class with links and files.

### 4.7 Admissions CRM
- Enquiry sources: web form, QR code, WhatsApp, phone, walk-in; duplicate check by phone.
- Pipeline: new → contacted → visit scheduled → application → test/interview → offered → fee paid → enrolled → lost (with reason). Follow-up tasks and reminders per counsellor; message templates.
- Online application: parent details, child details, documents upload, application fee payment; OCR-assisted fill from Aadhaar/TC/birth certificate with a **mandatory human review step** (never auto-accept OCR output).
- Seat matrix by class with quotas (RTE/category/sibling/staff-ward); waitlist with auto-offer to next candidate; merit list.
- Conversion creates the student record, generates fees, assigns class/section/roll, issues admission letter.
- Analytics: funnel, source ROI, counsellor performance, time-in-stage.

### 4.8 Examinations and results
- Exam scheme: terms, assessments, weightages, max marks, pass marks, practical/internal components, board-specific grade scales.
- Schedule: datesheet, hall tickets (QR), seating plan, invigilation roster.
- Marks entry: per subject by teacher, validations (max marks, absent codes), offline entry, bulk import; lock after submission; reopen requires approval and is audited.
- Computation: totals, percentages, grades, ranks, grace marks rules, supplementary/re-evaluation workflow.
- Report cards: template per class/board, bulk PDF, digital publish with a publish date, optional fee-hold rule (config; default off), NEP holistic progress card sections (scholastic, co-scholastic, self/peer/teacher assessment).
- AI-assisted remarks (Phase 3): drafts from a student's marks and attendance in the chosen language; **teacher must review and approve each remark** before it appears.
- Analytics: topper list, subject trends, class comparison, question-level analysis when data exists.

### 4.9 Timetable
- Inputs: subjects per class with weekly periods, teacher availability and qualifications, rooms, break rules.
- Generation and manual edit with real-time clash detection (teacher, room, class); workload balance view.
- Substitutions: when a teacher is absent, suggest free qualified teachers, notify the substitute, update class and parent views.
- Publish with effective-from date; history retained.

### 4.10 Transport
- Entities: vehicles (docs and expiry), drivers/attendants (licence, expiry, police verification record as a document), routes with ordered stops and times, student-stop assignment with transport fee linkage.
- Trip lifecycle: scheduled → started → in progress → ended; boarding and alighting events per student (scan or tap); alerts per 1.9.
- Safety: SOS, speed and route-deviation alerts to admin, missed-stop alerts, parent report of issues.
- Maintenance: service schedule, fuel log, expiry reminders (insurance, fitness, permit, PUC).

### 4.11 Compliance
- **Consent ledger:** consent records (purpose, text version, who gave it, how verified, timestamp, withdrawal). Admission and enrolment flows capture parental consent; the app shows each parent their consents with a withdraw action. Features that use data beyond core schooling (photos in gallery, biometric attendance, third-party sharing) require their own consent.
- **Data rights:** request export, correction, erasure; track requests to completion with deadlines; retention rules per data type with scheduled deletion/anonymisation.
- **Breach workflow:** incident record, affected-data summary, notification templates, timeline.
- **APAAR/PEN tracker:** per student status (not started, in progress, generated, mismatch), Aadhaar-name mismatch checker (compare the school record with the name the parent provides, flag differences), bulk action lists, saturation dashboard.
- **UDISE+ readiness:** field completeness checker per student/staff/school, error list, exportable data pack. (Verify the current official data format before building the export.)
- **Board/inspection packs:** attendance, staff qualification, infrastructure, fee structure documents.

### 4.12 Certificates and ID cards
- Templates for TC, bonafide, conduct, character, fee certificate with request → approval → issue; numbered register; QR for verification.
- Student and staff ID cards with photo, QR, and APAAR ID; bulk print PDF; lost-card reissue with fee.

### 4.13 Gate and visitor management
- Parent maintains authorised pickup list (name, relationship, phone, photo); one-time pickup pass generated in-app as QR with expiry.
- Gate scans QR; app shows guardian photo and student to release; entry/exit logged; mismatch triggers parent alert.
- Visitor log with host notification and badge; early dismissal approval flow.

### 4.14 HR and payroll (Phase 3)
- Staff master, documents, contracts, qualifications.
- Leave policies, balances, approvals, holiday calendar integrated with attendance.
- Salary structures: basic, allowances, deductions, pay-commission style scales or custom, PF/ESI, state professional tax, TDS; monthly run with preview, lock, payslips, bank advice file; loans and advances.
- Recruitment pipeline; appraisals; training records; workload report from timetable.

### 4.15 Library, hostel, inventory, canteen, health, events (Phase 3)
- **Library:** catalogue with barcode/QR, issue/return by scan, due dates, fines, reservations, digital resources.
- **Hostel:** buildings/rooms/beds, allocation, mess plan, outpass and visitor approvals with parent consent, fee linkage.
- **Inventory:** items, stock in/out, issue to class/staff, reorder level alerts, purchase orders, vendors.
- **Canteen/uniform shop:** prepaid wallet, pre-orders, parent top-up, spend limits by parent.
- **Health:** student health records (restricted access), infirmary visit log, vaccination records, parent notification on visits.
- **Events/clubs/sports:** calendar, registrations, results, certificates, gallery.
- **Facility booking:** labs, halls, grounds with conflict check.
- **Alumni:** directory, opt-in engagement.

### 4.16 LMS-lite and AI (Phase 3)
- Question bank by subject/chapter/difficulty; quiz builder with auto-grading; timed quizzes in-app with offline start and sync on submit.
- AI question-paper and worksheet generator from syllabus tags, output reviewed and edited by the teacher before use.
- AI assist features all follow: **human review before anything reaches a student or parent**; no student personal data sent to external AI services unless the school has explicitly enabled it and the data is minimised/anonymised; log AI-generated content and reviewer.
- Principal "ask your data": translates questions to approved, read-only queries over a defined analytics schema; shows the query scope; respects role permissions; no free-form access to personal records.

### 4.17 Analytics
- Principal dashboard (web and mobile-lite), class/teacher/subject analytics, admissions funnel, fee collection and ageing, staff attendance, transport utilisation.
- Early-warning flags (attendance drop, marks drop, fee delay) shown as suggestions with the reasons visible; counsellor/teacher marks "reviewed/action taken".
- Custom report builder with saved reports, scheduled email, export to Excel/PDF.

---

## 5. Cross-cutting requirements
- **Search** everywhere: students by name/admission number/guardian phone; fast (indexed), typo tolerant where cheap.
- **Bulk import/export** for every master (students, staff, fees, marks) with a template, a validation preview and a downloadable error report.
- **Print/PDF**: receipts, report cards, certificates, ID cards, hall tickets generated server-side from templates; keep templates in data, not code.
- **Localization:** English, Tamil, Hindi at launch; templates, notifications and PDFs support them; right fonts embedded for PDFs.
- **Accessibility:** labels, contrast, text scaling, no colour-only meaning.
- **Observability:** structured logs without personal data, request IDs, error tracking, job-queue dashboards.
- **Backups:** daily automated database backups with a tested restore procedure documented.

---

## 6. Data minimisation checklist (apply to every feature)
Before adding any field, screen or integration, answer: Is this needed for schooling? Who can see it? How long is it kept? Does it need consent? If the answer is unclear, leave it out and note it for review.

---

## 7. Testing matrix (minimum)
- **Permissions:** each role can only see/do what its matrix allows; parent sees only linked children; tenant isolation across every endpoint group.
- **Money:** allocation order, partial payments, refunds, concessions, late fees, rounding, webhook idempotency, reconciliation edge cases.
- **Offline/sync:** per 1.5.
- **Attendance:** edit-window rules, leave auto-mark, duplicate submit.
- **Exams:** locked exam rejection, grade computation per scheme, rank ties.
- **Notifications:** correct recipients, channel fallback, no duplicate sends, quiet hours.
- **Compliance:** consent withdrawal stops dependent processing; erasure request completes and is logged.
- **Mobile E2E (5 to 8 flows):** login with OTP; mark attendance offline then sync; pay fees; view/download report card; post and submit homework; driver trip start/end; gate QR verify.

---

## 8. Seed and demo data
One demo school with: 3 classes × 2 sections, ~120 students with siblings, ~15 staff, fee structures with concessions, a month of attendance, a published exam with marks, notices, homework, one bus route with a simulated trip, and demo users for every role (documented in README with test OTP behaviour in non-production only).

---

## 9. Build order for the mobile app and modules
1. Mobile shell: auth (school code + OTP), session, role routing, theme/branding, i18n, API client, error/empty states, push registration, inbox.
2. SIS read + parent child switcher.
3. Attendance (teacher marking offline + parent view + absence alert) including sync layer.
4. Fees (parent pay + receipts; accountant counter collection).
5. Notices and messaging.
6. Homework and diary.
7. Principal dashboard + approvals.
8. Leave, certificates requests, grievance desk.
9. Exams and report cards.
10. Transport (driver app + parent live map).
11. Gate/visitor, consent ledger and compliance screens.
12. Admissions, timetable, HR, and Phase 3 modules.

After each step: run on a real low-end Android device or emulator profile, verify the performance budgets in 1.12, update `CLAUDE.md`, open a PR with a short summary, and report what was built, what was left out on purpose, and test results.

---

## 10. Final instruction
Implement the next unfinished step from section 9 using the existing repo conventions. Keep code minimal and efficient, rely on libraries and generated artifacts, avoid abstractions without a second user, and never trade correctness for brevity in money, permissions, sync and compliance logic. Show evidence (test output, running screens) before declaring a step complete.