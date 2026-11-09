import { z } from "zod";
import { eq, desc, asc, and } from "drizzle-orm";
import { db, routes, stops, trips, tripPoints, vehicles } from "../../db/index";

const tripSchema = z.object({
  routeId: z.string().uuid(),
  vehicleId: z.string().uuid().optional(),
});

const pointSchema = z.object({
  tripId: z.string().uuid(),
  latitude: z.string(),
  longitude: z.string(),
});

export async function transportRoutes(fastify: any) {
  fastify.get("/routes", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(routes).where(eq(routes.tenantId, tenantId));
    return reply.send({ items });
  });

  fastify.get("/stops", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const { routeId } = req.query as { routeId?: string };
    const conditions = [eq(stops.tenantId, tenantId)];
    if (routeId) conditions.push(eq(stops.routeId, routeId));
    const items = await db
      .select()
      .from(stops)
      .where(conditions.length === 1 ? conditions[0] : and(...conditions))
      .orderBy(asc(stops.sequence));
    return reply.send({ items });
  });

  fastify.get("/trips", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(trips).where(eq(trips.tenantId, tenantId)).orderBy(desc(trips.createdAt));
    return reply.send({ items });
  });

  fastify.post(
    "/trips",
    { schema: { body: tripSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { routeId, vehicleId } = tripSchema.parse(req.body);
      const [trip] = await db.insert(trips).values({ tenantId, routeId, vehicleId, status: "scheduled" }).returning();
      return reply.code(201).send(trip);
    }
  );

  fastify.post(
    "/trips/:id/start",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [trip] = await db
        .update(trips)
        .set({ status: "started", startedAt: new Date(), updatedAt: new Date() })
        .where(eq(trips.id, req.params.id))
        .returning();
      if (!trip) return reply.code(404).send({ code: "not_found", message: "trip not found" });
      return reply.send(trip);
    }
  );

  fastify.post(
    "/trips/:id/end",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const [trip] = await db
        .update(trips)
        .set({ status: "ended", endedAt: new Date(), updatedAt: new Date() })
        .where(eq(trips.id, req.params.id))
        .returning();
      if (!trip) return reply.code(404).send({ code: "not_found", message: "trip not found" });
      return reply.send(trip);
    }
  );

  fastify.post(
    "/trip-points",
    { schema: { body: pointSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const { tripId, latitude, longitude } = pointSchema.parse(req.body);
      const [point] = await db.insert(tripPoints).values({ tenantId, tripId, latitude, longitude }).returning();
      return reply.code(201).send(point);
    }
  );

  fastify.get(
    "/trips/:id/points",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
      const items = await db
        .select()
        .from(tripPoints)
        .where(and(eq(tripPoints.tripId, req.params.id), eq(tripPoints.tenantId, tenantId)))
        .orderBy(asc(tripPoints.recordedAt));
      return reply.send({ items });
    }
  );

  fastify.get("/vehicles", async (req: any, reply: any) => {
    const tenantId = req.user?.tenantId;
    if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });
    const items = await db.select().from(vehicles).where(eq(vehicles.tenantId, tenantId));
    return reply.send({ items });
  });
}
