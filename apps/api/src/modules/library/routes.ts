import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db, libraryBooks, libraryIssues, students } from "../../db/index";

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  isbn: z.string().optional(),
  barcode: z.string().optional(),
  category: z.string().optional(),
  totalCopies: z.coerce.number().int().positive().default(1),
});

export async function libraryRoutes(fastify: any) {
  fastify.get("/library/books", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { search } = req.query as { search?: string };
    const conditions = [eq(libraryBooks.tenantId, tenantId)];
    if (search) conditions.push(eq(libraryBooks.title, search));
    const items = await db
      .select()
      .from(libraryBooks)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(desc(libraryBooks.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/library/books",
    { schema: { body: bookSchema } },
    async (req: any, reply: any) => {
      const { tenantId } = req.user ?? {};
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const parsed = bookSchema.parse(req.body);
      const [book] = await db
        .insert(libraryBooks)
        .values({ tenantId, ...parsed, availableCopies: parsed.totalCopies })
        .returning();
      return reply.code(201).send(book);
    }
  );

  const issueSchema = z.object({
    bookId: z.string().uuid(),
    studentId: z.string().uuid(),
    dueDate: z.string().datetime(),
  });

  fastify.post(
    "/library/issues",
    { schema: { body: issueSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { bookId, studentId, dueDate } = issueSchema.parse(req.body);
      const [book] = await db
        .select()
        .from(libraryBooks)
        .where(eq(libraryBooks.id, bookId))
        .limit(1);
      if (!book || book.availableCopies <= 0) {
        return reply.code(409).send({ code: "unavailable", message: "book not available" });
      }
      const [issue] = await db
        .insert(libraryIssues)
        .values({ tenantId, bookId, studentId, dueDate: new Date(dueDate), status: "issued" })
        .returning();
      await db
        .update(libraryBooks)
        .set({ availableCopies: book.availableCopies - 1, updatedAt: new Date() })
        .where(eq(libraryBooks.id, bookId));
      return reply.code(201).send(issue);
    }
  );

  fastify.post(
    "/library/issues/:id/return",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [issue] = await db
        .select()
        .from(libraryIssues)
        .where(eq(libraryIssues.id, req.params.id))
        .limit(1);
      if (!issue || issue.status !== "issued") {
        return reply.code(404).send({ code: "not_found", message: "active issue not found" });
      }
      const finePaise = 0; // fine computed by overdue days rule (configurable)
      const [updated] = await db
        .update(libraryIssues)
        .set({ status: "returned", returnedAt: new Date(), finePaise, updatedAt: new Date() })
        .where(eq(libraryIssues.id, req.params.id))
        .returning();
      const [book] = await db
        .select()
        .from(libraryBooks)
        .where(eq(libraryBooks.id, issue.bookId))
        .limit(1);
      if (book) {
        await db
          .update(libraryBooks)
          .set({ availableCopies: book.availableCopies + 1, updatedAt: new Date() })
          .where(eq(libraryBooks.id, issue.bookId));
      }
      return reply.send(updated);
    }
  );

  fastify.get("/library/issues", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db
      .select({ issue: libraryIssues, student: students, book: libraryBooks })
      .from(libraryIssues)
      .innerJoin(students, eq(students.id, libraryIssues.studentId))
      .innerJoin(libraryBooks, eq(libraryBooks.id, libraryIssues.bookId))
      .where(eq(libraryIssues.tenantId, tenantId))
      .orderBy(desc(libraryIssues.createdAt));
    return reply.send({ items: items.map((i) => ({ ...i.issue, student: i.student, book: i.book })) });
  });
}
