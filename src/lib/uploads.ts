import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"]);
const MAX_BYTES = 2 * 1024 * 1024; // 2 MB

function extFor(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "jpg";
}

/** Save a tenant logo under public/uploads and return the public URL path. */
export async function saveTenantLogo(tenantId: string, file: File): Promise<string> {
  if (!ALLOWED.has(file.type)) {
    throw new Error("Logo must be PNG, JPEG, WebP, or GIF.");
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    throw new Error("Logo must be under 2 MB.");
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const ext = extFor(file.type);
  const dir = path.join(process.cwd(), "public", "uploads", tenantId);
  await mkdir(dir, { recursive: true });
  const filename = `logo-${Date.now()}.${ext}`;
  await writeFile(path.join(dir, filename), bytes);
  return `/uploads/${tenantId}/${filename}`;
}
