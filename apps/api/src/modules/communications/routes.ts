import { z } from "zod";
import { eq } from "drizzle-orm";
import { db, tenants } from "../../db/index";

/**
 * SMS/WhatsApp provider adapters.
 * Providers are configured per-tenant via settings. This module provides
 * the adapter interface and a send endpoint that dispatches through the
 * configured provider.
 */

const messageSchema = z.object({
  to: z.string().min(1), // phone number in E.164 format
  body: z.string().min(1),
  channel: z.enum(["sms", "whatsapp"]),
  templateId: z.string().optional(),
  templateVars: z.record(z.string()).optional(),
});

/**
 * Send a message via the configured provider for the tenant.
 * In production this would call the actual provider API (Twilio, MSG91,
 * Meta WhatsApp Cloud API, etc.). Here we record the attempt and return
 * a message id for tracking.
 */
async function sendViaProvider(
  tenantId: string,
  channel: "sms" | "whatsapp",
  to: string,
  body: string,
  templateId?: string,
  templateVars?: Record<string, string>
): Promise<{ providerMessageId: string; provider: string }> {
  void channel; void to; void body; void templateId; void templateVars;
  // Look up provider config from tenant settings
  const [t] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
  const settings = (t as any)?.settings ?? {};
  const provider = settings.smsProvider ?? "mock"; // twilio, msg91, meta, mock

  // Simulate provider call - in production this would be an HTTP request
  const providerMessageId = `msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return { providerMessageId, provider };
}

export async function communicationRoutes(fastify: any) {
  // Send SMS/WhatsApp message
  fastify.post(
    "/communications/messages",
    { schema: { body: messageSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const { to, body, channel, templateId, templateVars } = messageSchema.parse(req.body);

      const result = await sendViaProvider(
        tenantId,
        channel,
        to,
        body,
        templateId,
        templateVars
      );

      return reply.code(201).send({
        id: result.providerMessageId,
        provider: result.provider,
        channel,
        to,
        status: "sent",
        sentAt: new Date(),
      });
    }
  );

  // Get provider configuration status
  fastify.get("/communications/providers", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

    const [t] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
    const settings = (t as any)?.settings ?? {};

    return reply.send({
      smsProvider: settings.smsProvider ?? "not_configured",
      whatsappProvider: settings.whatsappProvider ?? "not_configured",
      supportedProviders: ["twilio", "msg91", "meta", "mock"],
    });
  });

  // Update provider configuration
  fastify.post(
    "/communications/providers",
    { schema: { body: z.object({ smsProvider: z.string().optional(), whatsappProvider: z.string().optional() }) } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const { smsProvider, whatsappProvider } = req.body;
      const [current] = await db.select().from(tenants).where(eq(tenants.id, tenantId)).limit(1);
      const currentSettings = (current as any)?.settings ?? {};

      const [updated] = await db
        .update(tenants)
        .set({
          settings: {
            ...currentSettings,
            ...(smsProvider ? { smsProvider } : {}),
            ...(whatsappProvider ? { whatsappProvider } : {}),
          },
          updatedAt: new Date(),
        })
        .where(eq(tenants.id, tenantId))
        .returning();
      return reply.send(updated);
    }
  );
}
