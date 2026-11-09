import { eq } from "drizzle-orm";
import { db, tenants, users, classes, sections, students, guardians } from "../db/index";

const DEMO_TENANT = {
  name: "Demo Public School",
  slug: "demo-school",
  board: "CBSE",
  defaultLanguage: "en",
  brandingPrimaryColor: "#0F766E",
};

const DEMO_USER = {
  phone: "+919876543210",
  role: "parent",
  phoneVerified: true,
};

async function seed() {
  // Idempotent: reuse existing demo tenant
  let [tenant] = await db.select().from(tenants).where(eq(tenants.slug, DEMO_TENANT.slug)).limit(1);
  if (!tenant) {
    [tenant] = await db.insert(tenants).values(DEMO_TENANT).returning();
  }

  let [user] = await db.select().from(users).where(eq(users.phone, DEMO_USER.phone)).limit(1);
  if (!user) {
    [user] = await db.insert(users).values({ ...DEMO_USER, tenantId: tenant.id }).returning();
  }

  // Classes + sections
  const classes5 = await db.insert(classes).values({ tenantId: tenant.id, name: "5", grade: "5", capacity: 40 }).returning();
  const sectionA = await db.insert(sections).values({ tenantId: tenant.id, classId: classes5[0].id, name: "A", capacity: 20 }).returning();
  const classes3 = await db.insert(classes).values({ tenantId: tenant.id, name: "3", grade: "3", capacity: 40 }).returning();
  const sectionC = await db.insert(sections).values({ tenantId: tenant.id, classId: classes3[0].id, name: "C", capacity: 20 }).returning();

  // Students (with siblings via shared guardian phone)
  const s1 = await db.insert(students).values({
    tenantId: tenant.id, admissionNumber: "DEMO-001", firstName: "Arav", lastName: "Sharma",
    classId: sectionA[0]?.classId ?? classes5[0].id, sectionId: sectionA[0].id, rollNumber: "1", status: "active",
  }).returning();
  const s2 = await db.insert(students).values({
    tenantId: tenant.id, admissionNumber: "DEMO-002", firstName: "Meera", lastName: "Sharma",
    classId: sectionC[0]?.classId ?? classes3[0].id, sectionId: sectionC[0].id, rollNumber: "2", status: "active",
  }).returning();

  await db.insert(guardians).values([
    { tenantId: tenant.id, studentId: s1[0].id, name: "Rajesh Sharma", relationship: "Father", phone: "+919876543210", isPrimary: true, isAuthorizedPickup: true },
    { tenantId: tenant.id, studentId: s2[0].id, name: "Rajesh Sharma", relationship: "Father", phone: "+919876543210", isPrimary: true, isAuthorizedPickup: true },
  ]);

  console.log("Demo school seeded:", tenant.slug, "| users:", user.phone);
  console.log("Students:", s1[0].admissionNumber, s2[0].admissionNumber);
  console.log("Test OTP: any 6-digit (in-memory store, non-production only)");
}

seed().catch((e) => {
  console.error("Seed failed:", e.message);
  process.exit(1);
});
