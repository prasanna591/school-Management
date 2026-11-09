import { z } from "zod";

export const tenantIdSchema = z.string().uuid("Invalid tenant id");

export const emailSchema = z.string().email("Invalid email");
export const phoneSchema = z
  .string()
  .min(10, "Invalid phone number")
  .max(15, "Invalid phone number");

export const languageSchema = z.enum(["en", "ta", "hi"]);

export const paginationSchema = z
  .object({
    cursor: z.string().optional(),
    limit: z.coerce.number().min(1).max(100).default(20),
  })
  .strict();

export type PaginationInput = z.infer<typeof paginationSchema>;

export const paginatedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
  z.object({
    items: itemSchema.array(),
    nextCursor: z.string().nullish(),
    hasMore: z.boolean(),
  });

export type PaginatedResponse<T> = {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
};

export const apiErrorSchema = z.object({
  code: z.string(),
  message: z.string(),
  fieldErrors: z.record(z.string().array()).optional(),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export const syncOutboxItemSchema = z.object({
  id: z.string().uuid(),
  entity: z.string(),
  payload: z.record(z.unknown()),
  createdAt: z.string().datetime(),
});

export type SyncOutboxItem = z.infer<typeof syncOutboxItemSchema>;

export const idempotencyKeySchema = z.string().uuid();

export type IdempotencyKey = z.infer<typeof idempotencyKeySchema>;
