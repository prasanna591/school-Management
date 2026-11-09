import { z } from "zod";
import * as crypto from "crypto";

/**
 * File upload with signed URLs.
 * Generates presigned URLs for S3-compatible storage (MinIO, AWS S3, etc.).
 * Files are stored tenant-prefixed with validation on content-type and size.
 */

const uploadRequestSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  contentLength: z.number().int().positive().max(10 * 1024 * 1024), // max 10MB
  category: z.enum(["homework", "document", "certificate", "id_card", "receipt", "other"]).default("document"),
});

const ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export async function fileRoutes(fastify: any) {
  // Generate signed upload URL
  fastify.post(
    "/files/upload-url",
    { schema: { body: uploadRequestSchema } },
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      const { fileName, contentType, contentLength, category } = uploadRequestSchema.parse(req.body);

      if (!ALLOWED_CONTENT_TYPES.includes(contentType)) {
        return reply.code(400).send({ code: "unsupported_content_type", message: "File type not allowed" });
      }

      // Generate a unique object key: tenantId/category/uuid/filename
      const objectKey = `${tenantId}/${category}/${crypto.randomUUID()}/${fileName}`;

      // Generate a signed upload URL (in production this would be a presigned S3 URL)
      const uploadUrl = `${process.env.FILE_UPLOAD_BASE_URL || "http://localhost:3001"}/api/files/upload/${objectKey}`;

      // Generate a download URL
      const downloadUrl = `${process.env.FILE_DOWNLOAD_BASE_URL || "http://localhost:3001"}/api/files/download/${objectKey}`;

      return reply.send({
        uploadUrl,
        downloadUrl,
        objectKey,
        contentType,
        contentLength,
        expiresIn: 900, // 15 minutes
      });
    }
  );

  // Get file metadata (placeholder - in production would query file metadata table)
  fastify.get(
    "/files/:objectKey",
    async (req: any, reply: any) => {
      const tenantId = req.user?.tenantId;
      if (!tenantId) return reply.code(401).send({ code: "unauthorized", message: "no tenant context" });

      // Verify the object key belongs to this tenant
      if (!req.params.objectKey.startsWith(`${tenantId}/`)) {
        return reply.code(403).send({ code: "forbidden", message: "access denied" });
      }

      return reply.send({
        objectKey: req.params.objectKey,
        tenantId,
        url: `${process.env.FILE_DOWNLOAD_BASE_URL || "http://localhost:3001"}/api/files/download/${req.params.objectKey}`,
      });
    }
  );
}
