import { z } from "zod";
import { eq, desc, and } from "drizzle-orm";
import { db, deviceTokens, inAppNotifications, users } from "../../db/index";

const deviceTokenSchema = z.object({
  deviceId: z.string().min(1),
  pushToken: z.string().min(1),
  platform: z.enum(["ios", "android", "web"]),
  appVersion: z.string().optional(),
});

export async function notificationRoutes(fastify: any) {
  // Register device push token
  fastify.post(
    "/device-tokens",
    { schema: { body: deviceTokenSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { deviceId, pushToken, platform, appVersion } = deviceTokenSchema.parse(req.body);

      const [dt] = await db
        .insert(deviceTokens)
        .values({ tenantId, userId: req.user?.sub, deviceId, pushToken, platform, appVersion, isActive: true })
        .onConflictDoUpdate({
          target: [deviceTokens.deviceId],
          set: { pushToken, platform, appVersion, isActive: true, updatedAt: new Date() },
        })
        .returning();
      return reply.code(201).send(dt);
    }
  );

  // List in-app notifications (inbox)
  fastify.get("/inbox", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { isRead, limit } = req.query as { isRead?: string; limit?: string };
    const conditions = [eq(inAppNotifications.tenantId, tenantId), eq(inAppNotifications.userId, req.user?.sub)];
    if (isRead !== undefined) conditions.push(eq(inAppNotifications.isRead, isRead === "true"));
    const items = await db
      .select()
      .from(inAppNotifications)
      .where(and(...conditions))
      .orderBy(desc(inAppNotifications.createdAt))
      .limit(isRead !== undefined ? (limit ? Number(limit) : 50) : (limit ? Number(limit) : 50));
    return reply.send({ items });
  });

  // Mark notification as read
  fastify.post(
    "/inbox/:id/read",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [n] = await db
        .update(inAppNotifications)
        .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(inAppNotifications.id, req.params.id),
            eq(inAppNotifications.tenantId, tenantId),
            eq(inAppNotifications.userId, req.user?.sub)
          )
        )
        .returning();
      if (!n) return reply.code(404).send({ code: "not_found", message: "notification not found" });
      return reply.send(n);
    }
  );

  // Mark all as read
  fastify.post(
    "/inbox/read-all",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      await db
        .update(inAppNotifications)
        .set({ isRead: true, readAt: new Date(), updatedAt: new Date() })
        .where(
          and(
            eq(inAppNotifications.tenantId, tenantId),
            eq(inAppNotifications.userId, req.user?.sub),
            eq(inAppNotifications.isRead, false)
          )
        );
      return reply.send({ ok: true });
    }
  );

  // Send push notification (admin only)
  const sendNotificationSchema = z.object({
    tenantId: z.string().uuid(),
    userIds: z.array(z.string().uuid()).optional(),
    category: z.enum(["attendance", "fees", "notices", "homework", "exams", "transport", "messages", "emergency"]),
    title: z.string().min(1),
    body: z.string().min(1),
    deepLink: z.string().optional(),
    isEmergency: z.boolean().default(false),
  });

  fastify.post(
    "/notifications/send",
    { schema: { body: sendNotificationSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      // Only admins/principals can send notifications
      if (!["super_admin", "trustee", "principal", "admin"].includes(req.user?.role ?? "")) {
        return reply.code(403).send({ code: "forbidden", message: "admin role required" });
      }

      const { userIds, category, title, body, deepLink, isEmergency } = sendNotificationSchema.parse(req.body);

      // Determine target users
      let targetUserIds: string[] = [];
      if (userIds) {
        targetUserIds = userIds;
      } else {
        // Send to all users in tenant
        const allUsers = await db
          .select({ id: users.id })
          .from(users)
          .where(eq(users.tenantId, tenantId));
        targetUserIds = allUsers.map((u) => u.id);
      }

      // Insert in-app notifications
      const notifications = targetUserIds.map((uid) => ({
        tenantId,
        userId: uid,
        title,
        body,
        category,
        deepLink,
        isEmergency,
      }));

      await db.insert(inAppNotifications).values(notifications);

      // TODO: Send push notifications via FCM/APNs via device tokens
      // This would call the gateway API here

      return reply.send({ sent: targetUserIds.length });
    }
  );
}
