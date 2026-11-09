-- Migration: Enable Row-Level Security on all tenant-owned tables
-- Application connects as a non-superuser role WITHOUT BYPASSRLS.
-- Each request sets app.tenant_id via set_config inside a transaction.

-- Create the application role (no superuser, no bypassrls)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'smartschool_app') THEN
    CREATE ROLE smartschool_app NOLOGIN;
  END IF;
END $$;

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO smartschool_app;

-- List of all tenant-owned tables
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename IN (
        'tenants','users','roles','permissions','role_permissions','user_roles',
        'academic_years','classes','sections','students','guardians',
        'audit_logs','consent_records','attendance_sessions','attendance_records',
        'fee_heads','fee_structures','fee_ledger_entries','payments','payment_orders',
        'notices','message_threads','message_messages','homeworks','homework_submissions',
        'exams','marks_entries','vehicles','routes','stops','trips','trip_points',
        'boarding_events','gate_passes','visitor_logs','admissions','subjects',
        'timetable_entries','staff','salary_structures','payroll_runs','payslips',
        'approvals','leave_requests','grievances','library_books','library_issues'
      )
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl.tablename);
    EXECUTE format(
      'CREATE POLICY tenant_isolation_%I ON %I FOR ALL TO smartschool_app USING (tenant_id = current_setting(''app.tenant_id'', true))',
      tbl.tablename, tbl.tablename
    );
  END LOOP;
END $$;

-- Grant CRUD on tables to the app role
DO $$
DECLARE
  tbl record;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename LIKE '%'  -- all tables
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON %I TO smartschool_app', tbl.tablename);
  END LOOP;
END $$;

-- Grant usage on sequences
DO $$
DECLARE
  seq record;
BEGIN
  FOR seq IN
    SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
  LOOP
    EXECUTE format('GRANT USAGE, SELECT ON SEQUENCE %I TO smartschool_app', seq.sequencename);
  END LOOP;
END $$;
