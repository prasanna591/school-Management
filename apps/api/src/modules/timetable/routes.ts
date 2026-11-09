import { z } from "zod";
import { eq, and, asc } from "drizzle-orm";
import { db, timetableEntries } from "../../db/index";

const entrySchema = z.object({
  classId: z.string().uuid(),
  sectionId: z.string().uuid().optional(),
  subjectId: z.string().uuid().optional(),
  teacherId: z.string().uuid().optional(),
  room: z.string().optional(),
  dayOfWeek: z.coerce.number().int().min(0).max(6),
  period: z.coerce.number().int().min(1).max(10),
});

export async function timetableRoutes(fastify: any) {
  fastify.get("/timetable", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { classId, sectionId, dayOfWeek } = req.query as {
      classId?: string;
      sectionId?: string;
      dayOfWeek?: string;
    };
    const conditions = [eq(timetableEntries.tenantId, tenantId)];
    if (classId) conditions.push(eq(timetableEntries.classId, classId));
    if (sectionId) conditions.push(eq(timetableEntries.sectionId, sectionId));
    if (dayOfWeek) conditions.push(eq(timetableEntries.dayOfWeek, Number(dayOfWeek)));
    const items = await db
      .select()
      .from(timetableEntries)
      .where(and(...conditions))
      .orderBy(asc(timetableEntries.dayOfWeek), asc(timetableEntries.period));
    return reply.send({ items });
  });

  fastify.post(
    "/timetable",
    { schema: { body: entrySchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { classId, sectionId, subjectId, teacherId, room, dayOfWeek, period } = entrySchema.parse(req.body);

      // Clash detection: class already has something in this slot
      const [classClash] = await db
        .select()
        .from(timetableEntries)
        .where(
          and(
            eq(timetableEntries.tenantId, tenantId),
            eq(timetableEntries.classId, classId),
            eq(timetableEntries.dayOfWeek, dayOfWeek),
            eq(timetableEntries.period, period)
          )
        )
        .limit(1);
      if (classClash) {
        return reply.code(409).send({ code: "clash", message: "Class already has a period in this slot" });
      }

      // Teacher clash
      if (teacherId) {
        const [teacherClash] = await db
          .select()
          .from(timetableEntries)
          .where(
            and(
              eq(timetableEntries.tenantId, tenantId),
              eq(timetableEntries.teacherId, teacherId),
              eq(timetableEntries.dayOfWeek, dayOfWeek),
              eq(timetableEntries.period, period)
            )
          )
          .limit(1);
        if (teacherClash) {
          return reply.code(409).send({ code: "clash", message: "Teacher already has a period in this slot" });
        }
      }

      // Room clash
      if (room) {
        const [roomClash] = await db
          .select()
          .from(timetableEntries)
          .where(
            and(
              eq(timetableEntries.tenantId, tenantId),
              eq(timetableEntries.room, room),
              eq(timetableEntries.dayOfWeek, dayOfWeek),
              eq(timetableEntries.period, period)
            )
          )
          .limit(1);
        if (roomClash) {
          return reply.code(409).send({ code: "clash", message: "Room already booked in this slot" });
        }
      }

      const [entry] = await db
        .insert(timetableEntries)
        .values({ tenantId, classId, sectionId, subjectId, teacherId, room, dayOfWeek, period })
        .returning();
      return reply.code(201).send(entry);
    }
  );
}
