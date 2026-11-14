export function appUrl() {
  return new URL(process.env.APP_URL || "http://localhost:3007");
}
export function allowedOrigins() {
  const url = appUrl(),
    origins = new Set([url.origin]);
  if (["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)) {
    origins.add(`${url.protocol}//localhost:${url.port || "80"}`);
    origins.add(`${url.protocol}//127.0.0.1:${url.port || "80"}`);
  }
  return origins;
}
export function validOrigin(request: Request) {
  const origin = request.headers.get("origin"),
    host = request.headers.get("host");
  return (
    (host
      ? [...allowedOrigins()].some((o) => new URL(o).host === host)
      : allowedOrigins().has(new URL(request.url).origin)) &&
    (!origin || allowedOrigins().has(origin))
  );
}
