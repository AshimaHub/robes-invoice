import { readFile } from "fs/promises";
import path from "path";
import { connection, NextResponse } from "next/server";

const TYPES: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
};

/** Serve a logo saved after the app started. The public folder only includes files from the build. */
export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  await connection();
  const { path: parts } = await context.params;
  if (!parts?.length || parts.some((part) => part === ".." || part.includes("\\") || part.includes("/"))) {
    return new NextResponse("Not found", { status: 404 });
  }

  const root = path.resolve(process.cwd(), "public", "uploads");
  const filePath = path.resolve(root, ...parts);
  if (filePath !== root && !filePath.startsWith(root + path.sep)) {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    const bytes = await readFile(filePath);
    const ext = parts[parts.length - 1]?.split(".").pop()?.toLowerCase() || "";
    return new NextResponse(bytes, {
      headers: {
        "Content-Type": TYPES[ext] || "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
