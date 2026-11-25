/** Lightweight address used to keep the free host awake. It does not touch the database. */
export function GET() {
  return new Response("ok", {
    status: 200,
    headers: { "content-type": "text/plain", "cache-control": "no-store" },
  });
}
