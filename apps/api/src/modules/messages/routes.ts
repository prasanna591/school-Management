import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db, messageThreads, messageMessages } from "../../db/index";

const threadSchema = z.object({
  title: z.string().optional(),
  participantIds: z.array(z.string().uuid()),
});

const messageSchema = z.object({
  body: z.string().min(1),
});

export async function messagesRoutes(fastify: any) {
  fastify.get("/message-threads", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db
      .select()
      .from(messageThreads)
      .where(eq(messageThreads.tenantId, tenantId))
      .orderBy(desc(messageThreads.updatedAt));
    return reply.send({ items });
  });

  fastify.post(
    "/message-threads",
    { schema: { body: threadSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { title, participantIds } = threadSchema.parse(req.body);
      const [thread] = await db
        .insert(messageThreads)
        .values({ tenantId, title, participantIds })
        .returning();
      return reply.code(201).send(thread);
    }
  );

  fastify.get(
    "/message-threads/:threadId/messages",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const items = await db
        .select()
        .from(messageMessages)
        .where(
          and(
            eq(messageMessages.threadId, req.params.threadId),
            eq(messageMessages.tenantId, tenantId)
          )
        )
        .orderBy(desc(messageMessages.createdAt));
      return reply.send({ items });
    }
  );

  fastify.post(
    "/message-threads/:threadId/messages",
    { schema: { body: messageSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { body } = messageSchema.parse(req.body);
      const [message] = await db
        .insert(messageMessages)
        .values({ tenantId, threadId: req.params.threadId, senderId: req.user?.sub, body })
        .returning();
      await db
        .update(messageThreads)
        .set({ updatedAt: new Date() })
        .where(eq(messageThreads.id, req.params.threadId));
      return reply.code(201).send(message);
    }
  );
}
